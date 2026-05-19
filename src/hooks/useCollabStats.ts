"use client";

/**
 * useCollabStats
 * ──────────────
 * Fetches real collaboration stats from /api/collaboration/stats.
 * Returns live impact-strip numbers, real activity stream entries derived
 * from the user's actual analysis history, and real research timeline events.
 *
 * Refreshes every 60 s so the dashboard stays current without a hard reload.
 */

import { useState, useEffect, useCallback } from "react";
import { ActivityEntry, TimelineEvent, TeamMember } from "@/app/dashboard/collaboration/collab-data";

export interface ImpactStatsData {
  activeResearchers: number;
  sharedDatasets: number;
  pipelinesExecuted: number;
  variantsIdentified: number;
  collabScore: number;
}

export interface Contributor {
  id: string;
  name: string;
  initials: string;
}

export interface ContributionData {
  date: string;
  count: number;
}

export interface CollabStatsReturn {
  activeUser: TeamMember | null;
  impactStats: ImpactStatsData | null;
  streams: ActivityEntry[];
  timeline: TimelineEvent[];
  contributors: Contributor[];
  contributions: Record<string, ContributionData[]>;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const DEFAULT_STATS: ImpactStatsData = {
  activeResearchers: 0,
  sharedDatasets: 0,
  pipelinesExecuted: 0,
  variantsIdentified: 0,
  collabScore: 0,
};

export function useCollabStats(): CollabStatsReturn {
  const [activeUser, setActiveUser] = useState<TeamMember | null>(null);
  const [impactStats, setImpactStats] = useState<ImpactStatsData | null>(null);
  const [streams, setStreams] = useState<ActivityEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [contributions, setContributions] = useState<Record<string, ContributionData[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/collaboration/stats?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        if (json.success && json.data) {
          if (json.data.activeUser) setActiveUser(json.data.activeUser);
          setImpactStats(json.data.impactStats ?? DEFAULT_STATS);
          setStreams(json.data.streams ?? []);
          setTimeline(json.data.timeline ?? []);
          setContributors(json.data.contributors ?? []);
          setContributions(json.data.contributions ?? {});
        } else {
          setError(json.error ?? "Failed to load collaboration stats");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Network error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  return { activeUser, impactStats, streams, timeline, contributors, contributions, loading, error, refresh };
}
