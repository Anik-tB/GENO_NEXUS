"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import Image from "next/image";

const MENU_CATEGORIES = [
  {
    title: "MAIN",
    items: [
      { label: "Overview", href: "/dashboard", icon: "🏠" },
      { label: "Upload DNA", href: "/dashboard/upload", icon: "📂" },
      { label: "Analysis", href: "/dashboard/analysis", icon: "🔬" },
      { label: "Reports", href: "/dashboard/reports", icon: "📄" },
    ]
  },
  {
    title: "FEATURES",
    items: [
      { label: "Predictions", href: "/dashboard/predictions", icon: "🔮" },
      { label: "Pharmacogenomics", href: "/dashboard/drugs", icon: "💊" },
      { label: "Outbreak", href: "/dashboard/outbreak", icon: "⚠️" },
      { label: "Visualization", href: "/dashboard/visualization", icon: "🧬" },
    ]
  },
  {
    title: "TOOLS",
    items: [
      { label: "Collaboration", href: "/dashboard/collaboration", icon: "🤝" },
      { label: "Settings", href: "/dashboard/settings", icon: "⚙️" },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Image src="/dna-icon.svg" alt="GenoNexus" width={24} height={24} className={styles.logo} />
        <h2 className={styles.brandTitle}>GenoNexus</h2>
        <span className={styles.collapseIcon}>«</span>
      </div>

      <nav className={styles.nav}>
        {MENU_CATEGORIES.map((category) => (
          <div key={category.title} className={styles.categoryBlock}>
            <p className={styles.sectionTitle}>{category.title} <span className={styles.chevron}>˅</span></p>
            <ul className={styles.menu}>
              {category.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link href={item.href} className={`${styles.link} ${isActive ? styles.active : ""}`}>
                      <span className={styles.icon}>{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className={styles.upgradeCard}>
          <div className={styles.upgradeHeader}>
            <span className={styles.upgradeIcon}>💎</span> Upgrade to Pro
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
