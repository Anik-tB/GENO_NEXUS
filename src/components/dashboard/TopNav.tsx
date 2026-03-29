"use client";

import styles from "./TopNav.module.css";
import Image from "next/image";

interface TopNavProps {
  userInitials: string;
  userName: string;
}

export function TopNav({ userInitials, userName }: TopNavProps) {
  return (
    <header className={styles.header}>
      <div className={styles.searchContainer}>
        <span className={styles.searchIcon}>🔍</span>
        <input 
          type="text" 
          placeholder="Search genes, mutations, or patients..." 
          className={styles.searchInput}
        />
        <div className={styles.slashKey}>/</div>
      </div>

      <div className={styles.tools}>
        <button className={styles.iconButton} title="Notifications">
          <span className={styles.bell}>🔔</span>
          <span className={styles.badge}>3</span>
        </button>

        <div className={styles.divider} />

        <div className={styles.profile}>
          <div className={styles.avatar}>{userInitials}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userRole}>Lead Geneticist</span>
          </div>
        </div>
      </div>
    </header>
  );
}
