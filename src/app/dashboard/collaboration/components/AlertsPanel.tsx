"use client";

import styles from "./AlertsPanel.module.css";
import { SciAlert } from "../collab-data";

interface Props {
  alerts: SciAlert[];
  onDismiss: (id: number) => void;
  visible: boolean;
}

const ALERT_ICONS: Record<string, string> = {
  pathogenic: "🧬",
  outbreak: "🦠",
  analysis_failed: "⚠️",
  drug_gene: "💊",
};

export default function AlertsPanel({ alerts, onDismiss, visible }: Props) {
  const activeAlerts = alerts.filter(a => !a.dismissed);

  if (!visible) return null;

  return (
    <div className={styles.alertsPanel}>
      <div className={styles.alertsPanelHeader}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <h3>Scientific Alerts</h3>
        <span className={styles.alertCountPill}>{activeAlerts.length}</span>
      </div>

      <div className={styles.alertsList}>
        {activeAlerts.length === 0 && (
          <div className={styles.alertsEmpty}>
            <span>✓</span>
            <p>No active alerts</p>
          </div>
        )}
        {activeAlerts.map(alert => (
          <div key={alert.id} className={`${styles.alertCard} ${styles[`alert_${alert.type}`]}`}>
            <div className={styles.alertCardTop}>
              <span className={styles.alertCategoryIcon}>{ALERT_ICONS[alert.category]}</span>
              <span className={`${styles.alertTypeBadge} ${styles[`alertBadge_${alert.type}`]}`}>
                {alert.type}
              </span>
              <span className={styles.alertTime}>{alert.time}</span>
            </div>
            <h4 className={styles.alertTitle}>{alert.title}</h4>
            <p className={styles.alertDesc}>{alert.desc}</p>
            <div className={styles.alertActions}>
              <button className={styles.alertActionBtn} onClick={() => onDismiss(alert.id)}>
                Acknowledge
              </button>
              <button className={styles.alertActionBtnSecondary}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
