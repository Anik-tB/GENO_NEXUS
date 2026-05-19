"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  TeamMember, ActivityEntry, Pipeline, SciAlert,
  TEAM, INITIAL_STREAMS, INCOMING_STREAMS,
  PIPELINES, INITIAL_ALERTS, INCOMING_ALERTS,
} from "./collab-data";

// Monotonically increasing counter — no collisions possible
let _uid = 1000;
function nextId() { return ++_uid; }

/** Schedule a callback at a random interval between [minMs, maxMs], then reschedule */
function useRandomInterval(callback: () => void, minMs: number, maxMs: number) {
  const savedCallback = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
      const delay = minMs + Math.random() * (maxMs - minMs);
      timeoutRef.current = setTimeout(tick, delay);
    }
    const delay = minMs + Math.random() * (maxMs - minMs);
    timeoutRef.current = setTimeout(tick, delay);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [minMs, maxMs]);
}

export function useCollabSimulation() {
  const [members, setMembers] = useState<TeamMember[]>(TEAM);
  const [streams, setStreams] = useState<ActivityEntry[]>(INITIAL_STREAMS);
  const [pipelines, setPipelines] = useState<Pipeline[]>(PIPELINES);
  const [alerts, setAlerts] = useState<SciAlert[]>(INITIAL_ALERTS);
  // tracks the latest entry id so the UI can flash the dot
  const [latestStreamId, setLatestStreamId] = useState<number | null>(null);
  const streamIndexRef = useRef(0);
  const alertIndexRef = useRef(0);

  // ── Presence simulation: toggle member status every ~8s ──
  useEffect(() => {
    const interval = setInterval(() => {
      setMembers(prev => prev.map(m => {
        if (m.id === "AI") return m;
        const rand = Math.random();
        if (rand < 0.25) {
          const statuses: TeamMember["status"][] = ["online", "busy", "offline"];
          const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          return { ...m, status: newStatus, typing: false };
        }
        return m;
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // ── Typing indicator simulation: flip every ~3s ──
  useEffect(() => {
    const interval = setInterval(() => {
      setMembers(prev => prev.map(m => {
        if (m.status === "offline" || m.id === "AI") return { ...m, typing: false };
        return { ...m, typing: Math.random() < 0.28 };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Activity stream: new entry every 6–12s (randomised) ──
  useRandomInterval(
    useCallback(() => {
      const idx = streamIndexRef.current;
      const source = INCOMING_STREAMS[idx % INCOMING_STREAMS.length];
      const id = nextId();
      const newEntry: ActivityEntry = { ...source, id, time: "just now", ts: Date.now() };
      setStreams(s => [newEntry, ...s].slice(0, 20));
      setLatestStreamId(id);
      streamIndexRef.current = (idx + 1) % INCOMING_STREAMS.length;
    }, []),
    6000,
    12000
  );

  // ── Pipeline progress simulation every 3s ──
  useEffect(() => {
    const interval = setInterval(() => {
      setPipelines(prev => prev.map(pipe => {
        if (pipe.status === "running" && pipe.progress < 100) {
          const inc = Math.floor(Math.random() * 3) + 1;
          const newProgress = Math.min(100, pipe.progress + inc);
          const newStatus = newProgress >= 100 ? "completed" as const : "running" as const;
          const etaMin = Math.max(0, Math.ceil((100 - newProgress) / 2));
          return {
            ...pipe,
            progress: newProgress,
            status: newStatus,
            eta: newStatus === "completed" ? undefined : `${etaMin} min`,
            stages: pipe.stages.map((s, i) => {
              const stageThreshold = ((i + 1) / pipe.stages.length) * 100;
              if (newProgress >= stageThreshold) return { ...s, status: "done" as const };
              if (newProgress >= stageThreshold - (100 / pipe.stages.length)) return { ...s, status: "active" as const };
              return s;
            }),
          };
        }
        return pipe;
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Alert simulation every ~30s ──
  useEffect(() => {
    const interval = setInterval(() => {
      const idx = alertIndexRef.current;
      const source = INCOMING_ALERTS[idx % INCOMING_ALERTS.length];
      const newAlert: SciAlert = { ...source, id: nextId(), time: "just now" };
      setAlerts(a => [newAlert, ...a.filter(x => !x.dismissed)].slice(0, 8));
      alertIndexRef.current = (idx + 1) % INCOMING_ALERTS.length;
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const dismissAlert = useCallback((id: number) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  }, []);

  const togglePipeline = useCallback((id: string, action: "pause" | "resume" | "stop") => {
    setPipelines(prev => prev.map(pipe => {
      if (pipe.id !== id) return pipe;
      switch (action) {
        case "pause": return { ...pipe, status: "paused" as const };
        case "resume": return { ...pipe, status: "running" as const };
        case "stop": return { ...pipe, status: "failed" as const, progress: pipe.progress };
        default: return pipe;
      }
    }));
  }, []);

  return {
    members,
    streams,
    pipelines,
    alerts,
    latestStreamId,
    dismissAlert,
    togglePipeline,
  };
}
