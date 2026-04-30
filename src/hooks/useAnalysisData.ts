"use client";

import { useState, useEffect } from "react";

export interface AnalysisMutation {
  position: number;
  reference: string;
  query: string;
  severity: "pathogenic" | "uncertain" | "benign";
  sub: string;
}

export interface AnalysisResult {
  hasData: boolean;
  fileName?: string;
  matchPct?: number;
  totalMutations?: number;
  pathogenicCount?: number;
  uncertainCount?: number;
  benignCount?: number;
  mutations?: AnalysisMutation[];
}

/**
 * Shared hook — fetches the user's latest completed comparison result
 * and classifies each mutation. Used by all three visualization components.
 */
export function useAnalysisData(): { data: AnalysisResult; loading: boolean } {
  const [data, setData] = useState<AnalysisResult>({ hasData: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/visualization/analysis-data")
      .then((r) => r.json())
      .then((d) => {
        // The API returns chromosomes but we also need raw mutations for the viz components
        // Fetch the raw comparison result separately
        if (d.hasData) {
          // Derive classified mutations from the chromosome data (already classified server-side)
          // and request raw mutations too
          return fetch("/api/visualization/mutations-raw")
            .then((r) => r.json())
            .then((raw) => ({ ...d, mutations: raw.mutations || [] }))
            .catch(() => d);
        }
        return d;
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { data, loading };
}
