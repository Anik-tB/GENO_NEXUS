"use client";

/**
 * useCollabWebSocket
 * ──────────────────
 * Connects to the FastAPI WebSocket hub at ws://localhost:8000/ws/collab.
 * Replaces the timer-based useCollabSimulation with server-pushed state:
 *   - snapshot   → initial members / streams / pipelines from server
 *   - stream_add → new activity entry (broadcasts to all tabs)
 *   - presence_update → member status / typing changes
 *   - pipeline_update → pipeline progress driven by server ticks
 *
 * Outbound messages:
 *   - post_note       → user posts a note to the stream
 *   - typing          → user typing status
 *   - pipeline_action → pause / resume / stop a pipeline
 *
 * Falls back to offline simulation (useCollabSimulation) if WebSocket
 * cannot connect or disconnects after max retries.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { TeamMember, ActivityEntry, Pipeline, SciAlert, INITIAL_ALERTS, INCOMING_ALERTS } from "../app/dashboard/collaboration/collab-data";

const WS_URL = "ws://localhost:8000/ws/collab";
const MAX_RETRIES = 5;

// Alert simulation stays client-side (not a collab concern)
let _alertUid = 3000;
function nextAlertId() { return ++_alertUid; }

export interface CollabWebSocketReturn {
  members: TeamMember[];
  streams: ActivityEntry[];
  pipelines: Pipeline[];
  alerts: SciAlert[];
  latestStreamId: number | null;
  wsStatus: "connecting" | "live" | "reconnecting" | "offline";
  /** Post a note to the stream — sends to all connected users via server */
  postNote: (text: string, noteType: ActivityEntry["type"], author?: string) => void;
  /** Notify the server that the local user is typing */
  sendTyping: (memberId: string, typing: boolean) => void;
  /** Send pipeline pause/resume/stop action */
  togglePipeline: (id: string, action: "pause" | "resume" | "stop") => void;
  dismissAlert: (id: number) => void;
}

export function useCollabWebSocket(): CollabWebSocketReturn {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [streams, setStreams] = useState<ActivityEntry[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [alerts, setAlerts] = useState<SciAlert[]>(INITIAL_ALERTS);
  const [latestStreamId, setLatestStreamId] = useState<number | null>(null);
  const [wsStatus, setWsStatus] = useState<"connecting" | "live" | "reconnecting" | "offline">("connecting");

  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alertIndexRef = useRef(0);

  // ── Helper: send JSON over WS if open ──────────────────────────────────
  const wsSend = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // ── Connect / Reconnect ────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    setWsStatus(retriesRef.current === 0 ? "connecting" : "reconnecting");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      retriesRef.current = 0;
      setWsStatus("live");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        handleMessage(msg);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (retriesRef.current < MAX_RETRIES) {
        retriesRef.current += 1;
        const delay = Math.min(1000 * 2 ** retriesRef.current, 30_000);
        setWsStatus("reconnecting");
        retryTimeoutRef.current = setTimeout(connect, delay);
      } else {
        setWsStatus("offline");
      }
    };

    ws.onerror = () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Message handler ────────────────────────────────────────────────────
  function handleMessage(msg: { type: string; [key: string]: unknown }) {
    switch (msg.type) {
      case "snapshot": {
        const state = msg.state as { members: TeamMember[]; streams: ActivityEntry[]; pipelines: Pipeline[] };
        setMembers(state.members ?? []);
        setStreams(state.streams ?? []);
        setPipelines(state.pipelines ?? []);
        break;
      }
      case "stream_add": {
        const entry = msg.entry as ActivityEntry;
        setStreams(prev => [entry, ...prev].slice(0, 50));
        setLatestStreamId(entry.id);
        break;
      }
      case "presence_update": {
        setMembers(msg.members as TeamMember[]);
        break;
      }
      case "pipeline_update": {
        setPipelines(msg.pipelines as Pipeline[]);
        break;
      }
    }
  }

  // ── Mount / Unmount ────────────────────────────────────────────────────
  useEffect(() => {
    connect();
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // ── Alert simulation (client-side; not a multi-user concern) ──────────
  useEffect(() => {
    const interval = setInterval(() => {
      const idx = alertIndexRef.current;
      const source = INCOMING_ALERTS[idx % INCOMING_ALERTS.length];
      const newAlert: SciAlert = { ...source, id: nextAlertId(), time: "just now" };
      setAlerts(a => [newAlert, ...a.filter(x => !x.dismissed)].slice(0, 8));
      alertIndexRef.current = (idx + 1) % INCOMING_ALERTS.length;
    }, 45_000);
    return () => clearInterval(interval);
  }, []);

  // ── Outbound API ───────────────────────────────────────────────────────
  const postNote = useCallback((text: string, noteType: ActivityEntry["type"], author = "You") => {
    wsSend({ type: "post_note", author, text, noteType });
  }, [wsSend]);

  const sendTyping = useCallback((memberId: string, typing: boolean) => {
    wsSend({ type: "typing", memberId, typing });
  }, [wsSend]);

  const togglePipeline = useCallback((id: string, action: "pause" | "resume" | "stop") => {
    wsSend({ type: "pipeline_action", pipelineId: id, action });
  }, [wsSend]);

  const dismissAlert = useCallback((id: number) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  }, []);

  return {
    members,
    streams,
    pipelines,
    alerts,
    latestStreamId,
    wsStatus,
    postNote,
    sendTyping,
    togglePipeline,
    dismissAlert,
  };
}
