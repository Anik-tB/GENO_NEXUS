"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TeamMember, ActivityEntry, Pipeline, SciAlert,
  TEAM, INITIAL_STREAMS, INCOMING_STREAMS,
  PIPELINES, INITIAL_ALERTS, INCOMING_ALERTS,
} from "./collab-data";

export function useCollabSimulation() {
  const [members, setMembers] = useState<TeamMember[]>(TEAM);
  const [streams, setStreams] = useState<ActivityEntry[]>(INITIAL_STREAMS);
  const [pipelines, setPipelines] = useState<Pipeline[]>(PIPELINES);
  const [alerts, setAlerts] = useState<SciAlert[]>(INITIAL_ALERTS);
  const [streamIndex, setStreamIndex] = useState(0);
  const [alertIndex, setAlertIndex] = useState(0);

  // ── Presence simulation: toggle member status ──
  useEffect(() => {
    const interval = setInterval(() => {
      setMembers(prev => prev.map(m => {
        if (m.id === "AI") return m; // AI always active
        const rand = Math.random();
        if (rand < 0.15) {
          const statuses: TeamMember["status"][] = ["online", "busy", "offline"];
          const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          return { ...m, status: newStatus, typing: false };
        }
        return m;
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // ── Typing indicator simulation ──
  useEffect(() => {
    const interval = setInterval(() => {
      setMembers(prev => prev.map(m => {
        if (m.status === "offline" || m.id === "AI") return { ...m, typing: false };
        return { ...m, typing: Math.random() < 0.2 };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Activity stream: add new entries ──
  useEffect(() => {
    const interval = setInterval(() => {
      setStreamIndex(prev => {
        const next = prev + 1;
        if (next <= INCOMING_STREAMS.length) {
          const newEntry = { ...INCOMING_STREAMS[prev], id: Date.now(), time: "just now" };
          setStreams(s => [newEntry, ...s].slice(0, 15));
        }
        return next >= INCOMING_STREAMS.length ? 0 : next;
      });
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // ── Pipeline progress simulation ──
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
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // ── Alert simulation ──
  useEffect(() => {
    const interval = setInterval(() => {
      setAlertIndex(prev => {
        const next = prev + 1;
        if (next <= INCOMING_ALERTS.length) {
          const newAlert = { ...INCOMING_ALERTS[prev], id: Date.now(), time: "just now" };
          setAlerts(a => [newAlert, ...a.filter(x => !x.dismissed)].slice(0, 8));
        }
        return next >= INCOMING_ALERTS.length ? 0 : next;
      });
    }, 20000);
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
    dismissAlert,
    togglePipeline,
  };
}
