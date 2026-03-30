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
          <svg className={styles.pillIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>Reports</span>
          <div className={styles.pillDivider} />
          <svg className={styles.pillIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>{timeString}</span>
        </div>

        <div className={styles.searchContainer}>
          <div className={styles.searchIconWrapper}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search for any health metrics..." 
            className={styles.searchInput}
          />
        </div>

        <button className={styles.iconButton} title="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>

        <div className={styles.profile}>
          <div className={styles.avatar}>{userInitials}</div>
        </div>
      </div>
    </header>
  );
}
