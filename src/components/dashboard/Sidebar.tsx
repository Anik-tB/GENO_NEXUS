"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import Image from "next/image";

const Icons = {
  Overview: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Upload: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
  Analysis: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3v8l-4 9h14l-4-9V3"></path><path d="M9 3h6"></path><path d="M8 14h8"></path></svg>,
  Reports: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Predictions: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>,
  Drugs: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20.5 4 14l6.5-6.5a4.95 4.95 0 1 1 7 7z"></path><path d="M10.5 14 14 10.5"></path></svg>,
  Outbreak: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  Visualization: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>,
  Collaboration: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  ChevronDown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  ChevronLeft: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,
  Message: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
};

const MENU_CATEGORIES = [
  {
    title: "MAIN",
    items: [
      { label: "Overview", href: "/dashboard", icon: Icons.Overview },
      { label: "Upload DNA", href: "/dashboard/upload", icon: Icons.Upload },
      { label: "Analysis", href: "/dashboard/analysis", icon: Icons.Analysis },
      { label: "Reports", href: "/dashboard/reports", icon: Icons.Reports },
    ]
  },
  {
    title: "FEATURES",
    items: [
      { label: "Predictions", href: "/dashboard/predictions", icon: Icons.Predictions },
      { label: "Pharmacogenomics", href: "/dashboard/drugs", icon: Icons.Drugs },
      { label: "Outbreak", href: "/dashboard/outbreak", icon: Icons.Outbreak },
      { label: "Visualization", href: "/dashboard/visualization", icon: Icons.Visualization },
    ]
  },
  {
    title: "TOOLS",
    items: [
      { label: "Messages", href: "/dashboard/chat", icon: Icons.Message },
      { label: "Collaboration", href: "/dashboard/collaboration", icon: Icons.Collaboration },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    MAIN: true,
    FEATURES: true,
    TOOLS: true,
  });

  const toggleCategory = (title: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      <div className={styles.brand}>
        <Image src="/dna-icon.svg" alt="GenoNexus" width={24} height={24} className={styles.logo} />
        {!isCollapsed && <h2 className={styles.brandTitle}>GenoNexus</h2>}
        <button 
          className={styles.collapseIcon} 
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle Sidebar"
        >
          {Icons.ChevronLeft}
        </button>
      </div>

      <nav className={styles.nav}>
        {MENU_CATEGORIES.map((category) => {
          const isOpen = openCategories[category.title];

          return (
            <div key={category.title} className={styles.categoryBlock}>
              <button 
                className={styles.sectionTitle} 
                onClick={() => !isCollapsed && toggleCategory(category.title)}
                title={isCollapsed ? category.title : ""}
              >
                {!isCollapsed && <span className={styles.sectionTitleText}>{category.title}</span>}
                {!isCollapsed && (
                  <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>
                    {Icons.ChevronDown}
                  </span>
                )}
                {isCollapsed && <span className={styles.collapsedCategoryDivider} />}
              </button>
              
              <ul className={`${styles.menu} ${!isOpen && !isCollapsed ? styles.menuClosed : ""}`}>
                {category.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link href={item.href} className={`${styles.link} ${isActive ? styles.active : ""}`} title={item.label}>
                        <span className={styles.icon}>{item.icon}</span>
                        {!isCollapsed && <span className={styles.linkText}>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        <div className={styles.upgradeCard}>
          <div className={styles.upgradeHeader}>
            <span className={styles.upgradeIcon}>💎</span> <span className={styles.upgradeTitleText}>Upgrade to Pro</span>
          </div>
          <p className={styles.upgradeText}>Get insights on coverage and eligibility with AI. Simplify decisions.</p>
          <div className={styles.upgradeActions}>
            <button className={styles.upgradeBtn}>✨ Upgrade</button>
            <a href="#" className={styles.learnMore}>Learn More</a>
          </div>
        </div>
      </nav>
    </aside>
  );
}
