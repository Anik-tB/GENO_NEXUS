"use client";

import styles from "./TopNav.module.css";
import Image from "next/image";

interface TopNavProps {
  userInitials: string;
  userName: string;
}

export function TopNav({ userInitials, userName }: TopNavProps) {
  // Use a mock datetime like the reference image
  const timeString = "12:37 PM, Wed";

  return (
    <header className={styles.header}>
      <div className={styles.spacer} /> {/* Pushes content to the right */}

      <div className={styles.tools}>
        <div className={styles.infoPill}>
          <span className={styles.pillIcon}>⏱️</span>
          <span>Reports</span>
          <div className={styles.pillDivider} />
          <span className={styles.pillIcon}>📅</span>
          <span>{timeString}</span>
        </div>

        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>🔍</span>
          <input 
            type="text" 
            placeholder="Search for any health metrics..." 
            className={styles.searchInput}
          />
        </div>

        <button className={styles.iconButton} title="Messages">
          <span>📨</span>
        </button>

        <div className={styles.profile}>
          <div className={styles.avatar}>{userInitials}</div>
        </div>
      </div>
    </header>
  );
}
