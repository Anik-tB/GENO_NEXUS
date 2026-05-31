"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { useCollabWebSocket } from "@/hooks/useCollabWebSocket";
import { useCollabStats } from "@/hooks/useCollabStats";
import ImpactStrip from "./components/ImpactStrip";
import PresenceHeader from "./components/PresenceHeader";
import AlertsPanel from "./components/AlertsPanel";
import HypothesisBoard from "./components/HypothesisBoard";
import ActivityStream from "./components/ActivityStream";
import PipelineEngine from "./components/PipelineEngine";
import ResearchTimeline from "./components/ResearchTimeline";

export default function CollaborationNexus() {
  // Real data from the database
  const { activeUser, impactStats, streams: apiStreams, timeline, contributors, contributions, loading: statsLoading } = useCollabStats();

  const {
    members,
    streams: wsStreams,
    pipelines,
    alerts,
    latestStreamId,
    wsStatus,
    postNote,
    sendTyping,
    togglePipeline,
    spawnPipeline,
    dismissAlert,
    inviteMember,
  } = useCollabWebSocket(activeUser);

  const [activeHypothesis, setActiveHypothesis] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);

  const activeAlertCount = alerts.filter(a => !a.dismissed).length;

  // Merge WS streams (real-time additions) on top of API-fetched history
  // WS streams have higher priority (newest entries from live collab)
  const mergedStreams = (() => {
    if (wsStreams.length === 0) return apiStreams;
    const apiIds = new Set(apiStreams.map(s => s.id));
    const wsOnly = wsStreams.filter(s => !apiIds.has(s.id));
    return [...wsOnly, ...apiStreams].slice(0, 50);
  })();

  return (
    <div className={styles.nexusContainer}>
      {/* ── Research Impact Dashboard Strip ── */}
      <ImpactStrip stats={impactStats} loading={statsLoading} />

      {/* ── Presence Header ── */}
      <PresenceHeader
        members={members}
        alertCount={activeAlertCount}
        onToggleAlerts={() => setShowAlerts(!showAlerts)}
        onAddMember={inviteMember}
        wsStatus={wsStatus}
      />

      {/* ── Scientific Alerts Side Drawer ── */}
      <AlertsPanel
        alerts={alerts}
        onDismiss={dismissAlert}
        visible={showAlerts}
        onClose={() => setShowAlerts(false)}
      />

      {/* ── Main Grid ── */}
      <div className={styles.nexusGrid}>
        {/* Left Column: Hypothesis Board */}
        <section className={styles.boardCol}>
          <HypothesisBoard
            activeHypothesis={activeHypothesis}
            onSelectHypothesis={setActiveHypothesis}
          />
        </section>

        {/* Center Column: Live Activity */}
        <section id="history" className={styles.mainFeedCol}>
          <ActivityStream
            streams={mergedStreams}
            members={members}
            latestStreamId={latestStreamId}
            wsStatus={wsStatus}
            onPostNote={postNote}
            onTyping={sendTyping}
          />
        </section>

        {/* Right Column: Pipeline Engine */}
        <section className={styles.engineCol}>
          <PipelineEngine pipelines={pipelines} onToggle={togglePipeline} onSpawn={spawnPipeline} />
        </section>
      </div>

      {/* ── Research Timeline ── */}
      <div id="history">
        <ResearchTimeline timeline={timeline} contributors={contributors} contributions={contributions} loading={statsLoading} />
      </div>
    </div>
  );
}
