"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import Image from "next/image";

const MENU_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Upload DNA", href: "/dashboard/upload", icon: "🧬" },
  { label: "Analysis", href: "/dashboard/analysis", icon: "🔍" },
  { label: "Predictions", href: "/dashboard/predictions", icon: "🔮" },
  { label: "Outbreak", href: "/dashboard/outbreak", icon: "⚠️" },
  { label: "Pharmacogenomics", href: "/dashboard/drugs", icon: "💊" },
  { label: "Visualization", href: "/dashboard/visualization", icon: "👁️" },
  { label: "Reports", href: "/dashboard/reports", icon: "📄" },
  { label: "Collaboration", href: "/dashboard/collaboration", icon: "🤝" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logoGlow} />
        <Image src="/dna-icon.svg" alt="GenoNexus" width={32} height={32} className={styles.logo} />
        <div>
          <h2>GenoNexus</h2>
          <span>AI Genomics Platform</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <p className={styles.sectionTitle}>Main Navigation</p>
        <ul className={styles.menu}>
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link href={item.href} className={`${styles.link} ${isActive ? styles.active : ""}`}>
                  <span className={styles.icon}>{item.icon}</span>
                  {item.label}
                  {isActive && <div className={styles.activeIndicator} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <div className={styles.pulsingDot} />
          <span>System Status</span>
        </div>
        <div className={styles.statusItem}>
          <span>AI Core</span>
          <span className={styles.statusValueOk}>Stable</span>
        </div>
        <div className={styles.statusItem}>
          <span>Sequence Feed</span>
          <span className={styles.statusValueWarning}>Queued (3)</span>
        </div>
      </div>
    </aside>
  );
}
