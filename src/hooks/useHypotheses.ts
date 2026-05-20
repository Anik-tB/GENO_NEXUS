"use client";

import { useState, useEffect, useCallback } from "react";

export interface Hypothesis {
  id:          string;
  title:       string;
  tags:        string[];
  annotations: string[];
  confidence:  number;
  version:     number;
  active:      boolean;
  comments:    number;
  avatars:     string[];
  lastEdited:  string;
  chatMessages: ChatMessage[];
}

export interface ChatMessage {
  id:     number;
  author: string;
  text:   string;
  isAI:   boolean;
  time:   string;
}

export function useHypotheses() {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  // ── Fetch all hypotheses ──────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch("/api/collaboration/hypotheses");
      const json = await res.json();
      if (json.success) {
        setHypotheses(json.data);
      } else {
        setError(json.error ?? "Failed to load hypotheses");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Create ────────────────────────────────────────────────────
  const createHypothesis = useCallback(async (
    title: string,
    tags: string[] = [],
    annotations: string[] = []
  ): Promise<Hypothesis | null> => {
    try {
      const res  = await fetch("/api/collaboration/hypotheses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, tags, annotations }),
      });
      const json = await res.json();
      if (json.success) {
        setHypotheses(prev => [json.data, ...prev]);
        return json.data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // ── Update ────────────────────────────────────────────────────
  const updateHypothesis = useCallback(async (
    id: string,
    updates: Partial<Pick<Hypothesis, "title" | "tags" | "annotations" | "confidence" | "version">>
  ) => {
    try {
      await fetch(`/api/collaboration/hypotheses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setHypotheses(prev =>
        prev.map(h => h.id === id ? { ...h, ...updates } : h)
      );
    } catch {}
  }, []);

  // ── Delete (archive) ──────────────────────────────────────────
  const deleteHypothesis = useCallback(async (id: string) => {
    try {
      await fetch(`/api/collaboration/hypotheses/${id}`, { method: "DELETE" });
      setHypotheses(prev => prev.filter(h => h.id !== id));
    } catch {}
  }, []);

  // ── Post chat message ─────────────────────────────────────────
  const postMessage = useCallback(async (
    hypothesisId: string,
    author: string,
    text: string,
    isAI = false
  ) => {
    try {
      await fetch(`/api/collaboration/hypotheses/${hypothesisId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: { author, text, isAI } }),
      });
    } catch {}
  }, []);

  return {
    hypotheses,
    loading,
    error,
    fetchAll,
    createHypothesis,
    updateHypothesis,
    deleteHypothesis,
    postMessage,
  };
}
