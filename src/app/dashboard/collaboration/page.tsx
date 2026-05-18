"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { useCollabSimulation } from "./useCollabSimulation";
import ImpactStrip from "./components/ImpactStrip";
import PresenceHeader from "./components/PresenceHeader";
import AlertsPanel from "./components/AlertsPanel";
import HypothesisBoard from "./components/HypothesisBoard";
import ActivityStream from "./components/ActivityStream";
import PipelineEngine from "./components/PipelineEngine";
import ResearchTimeline from "./components/ResearchTimeline";

export default function CollaborationNexus() {
  const { members, streams, pipelines, alerts, dismissAlert, togglePipeline } = useCollabSimulation();
  const [activeHypothesis, setActiveHypothesis] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);

  const activeAlertCount = alerts.filter(a => !a.dismissed).length;

  return (
    <div className={styles.nexusContainer}>
      {/* ── Research Impact Dashboard Strip ── */}
      <ImpactStrip />

      {/* ── Presence Header ── */}
      <PresenceHeader
        members={members}
        alertCount={activeAlertCount}
        onToggleAlerts={() => setShowAlerts(!showAlerts)}
      />

      {/* ── Scientific Alerts Panel ── */}
      <AlertsPanel
        alerts={alerts}
        onDismiss={dismissAlert}
        visible={showAlerts}
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
        <section className={styles.mainFeedCol}>
          <ActivityStream streams={streams} members={members} />
        </section>

        {/* Right Column: Pipeline Engine */}
        <section className={styles.engineCol}>
          <PipelineEngine pipelines={pipelines} onToggle={togglePipeline} />
        </section>
      </div>

      {/* ── Research Timeline ── */}
      <ResearchTimeline />
    </div>
  );
}
