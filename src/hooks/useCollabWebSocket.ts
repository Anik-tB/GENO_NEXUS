"use client";

/**
 * useCollabWebSocket
 * ──────────────────
 * Connects to the FastAPI WebSocket hub at ws://localhost:8000/ws/collab.
 * Replaces the timer-based useCollabSimulation with server-pushed state:
 *   - snapshot        → initial members / streams / pipelines from server
 *   - stream_add      → new activity entry (broadcasts to all tabs)
 *   - presence_update → member status / typing changes
 *   - pipeline_update → pipeline progress driven by server ticks
 *
 * Outbound messages:
 *   - post_note       → user posts a note to the stream
 *   - typing          → user typing status
 *   - pipeline_action → pause / resume / stop a pipeline
 *
 * When the WebSocket is unavailable (no backend running), the hook:
 *   1. Seeds the activity stream from the real /api/collaboration/stats
 *      endpoint (your actual analysis history) — no dummy data.
 *   2. Keeps pipelines and members from collab-data as structural scaffolding
 *      (these represent running research infrastructure, not fake users).
 *   3. Accepts user-posted notes and prepends them locally.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  TeamMember,
  ActivityEntry,
  Pipeline,
  SciAlert,
  TEAM,
  PIPELINES,
  INITIAL_ALERTS,
  INCOMING_ALERTS,
} from "../app/dashboard/collaboration/collab-data";

const WS_URL = "ws://localhost:8000/ws/collab";
const MAX_RETRIES = 3; // Fewer retries — fail fast to real-data offline mode

// Alert simulation stays client-side
let _alertUid = 3000;
function nextAlertId() { return ++_alertUid; }

// Local note counter (avoids collisions with server IDs)
let _localNoteId = 9000;
function nextNoteId() { return ++_localNoteId; }

export interface CollabWebSocketReturn {
  members: TeamMember[];
  streams: ActivityEntry[];
  pipelines: Pipeline[];
  alerts: SciAlert[];
  latestStreamId: number | null;
  wsStatus: "connecting" | "live" | "reconnecting" | "offline";
  postNote: (text: string, noteType: ActivityEntry["type"], author?: string) => void;
  sendTyping: (memberId: string, typing: boolean) => void;
  togglePipeline: (id: string, action: "pause" | "resume" | "stop") => void;
  dismissAlert: (id: number) => void;
  inviteMember: (member: TeamMember) => void;
}

export function useCollabWebSocket(activeUser: TeamMember | null = null): CollabWebSocketReturn {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [streams, setStreams] = useState<ActivityEntry[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>(PIPELINES);
  const [alerts, setAlerts] = useState<SciAlert[]>(INITIAL_ALERTS);
  const [latestStreamId, setLatestStreamId] = useState<number | null>(null);
  const [wsStatus, setWsStatus] = useState<"connecting" | "live" | "reconnecting" | "offline">("connecting");

  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alertIndexRef = useRef(0);
  // Track whether we've already seeded from the API
  const seededRef = useRef(false);

  // ── Seed streams from real API data ────────────────────────────────────────
  const seedFromApi = useCallback(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    fetch("/api/collaboration/stats")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (json.success && json.data?.streams?.length > 0) {
          setStreams(json.data.streams.slice(0, 30));
          setLatestStreamId(json.data.streams[0]?.id ?? null);
        }
        // Also update pipeline running count from API if available
        if (json.data?.runningCount != null && json.data.runningCount > 0) {
          setPipelines(prev => prev.map((p, i) =>
            i === 0 ? { ...p, status: "running" } : p
          ));
        }
      })
      .catch(() => {
        // Silently ignore — streams will stay empty, user can still post notes
      });
  }, []);

  // ── Helper: send JSON over WS if open ──────────────────────────────────────
  const wsSend = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // ── Connect / Reconnect ────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    setWsStatus(retriesRef.current === 0 ? "connecting" : "reconnecting");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      retriesRef.current = 0;
      setWsStatus("live");
      ws.send(JSON.stringify({ type: "join", memberId: activeUser?.id, memberData: activeUser }));
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
        const delay = Math.min(1000 * 2 ** retriesRef.current, 15_000);
        setWsStatus("reconnecting");
        retryTimeoutRef.current = setTimeout(connect, delay);
      } else {
        setWsStatus("offline");
        // Seed from real API data when WS is not available
        seedFromApi();
        
        // Ensure the active user is still shown as online in offline mode
        if (activeUser) {
          setMembers([{ ...activeUser, status: "online" as const, viewing: "", typing: false }]);
        } else {
          setMembers([]);
        }
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [seedFromApi, activeUser]);

  // ── Message handler ────────────────────────────────────────────────────────
  function handleMessage(msg: { type: string; [key: string]: unknown }) {
    switch (msg.type) {
      case "snapshot": {
        const state = msg.state as { members: TeamMember[]; streams: ActivityEntry[]; pipelines: Pipeline[] };
        // WS gave us real data — mark seeded so we don't overwrite with API fallback
        seededRef.current = true;
        setMembers(state.members?.length ? state.members : []);
        setStreams(prev => {
          const incoming = state.streams ?? [];
          const merged = [
            ...incoming,
            ...prev.filter(s => !incoming.some(e => e.id === s.id)),
          ];
          return merged.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0)).slice(0, 50);
        });
        setPipelines(state.pipelines?.length ? state.pipelines : PIPELINES);
        break;
      }
      case "stream_add": {
        const entry = msg.entry as ActivityEntry;
        setStreams(prev => {
          if (prev.some(s => s.id === entry.id)) return prev;
          return [entry, ...prev].slice(0, 50);
        });
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

  // ── Mount / Unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeUser) return; // Wait for active user to be loaded from stats
    connect();
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect, activeUser]);

  // ── Alert simulation (client-side; not a multi-user concern) ──────────────
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

  // ── Outbound API ───────────────────────────────────────────────────────────
  const postNote = useCallback((text: string, noteType: ActivityEntry["type"], author = "You") => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Real-time path — server broadcasts to all connected clients
      wsSend({ type: "post_note", author, text, noteType });
    } else {
      // Offline path — prepend locally so the user's note appears immediately
      const localEntry: ActivityEntry = {
        id: nextNoteId(),
        type: noteType,
        author,
        desc: text,
        time: "just now",
        ts: Date.now(),
      };
      setStreams(prev => [localEntry, ...prev].slice(0, 50));
      setLatestStreamId(localEntry.id);
    }
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

  const inviteMember = useCallback((member: TeamMember) => {
    // Optimistic update
    setMembers(prev => {
      if (prev.some(m => m.id === member.id)) return prev;
      return [...prev, member];
    });
    wsSend({ type: "invite_member", memberData: member });
  }, [wsSend]);

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
    inviteMember,
  };
}
