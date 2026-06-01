"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/components/dashboard/Sidebar.module.css";
import Image from "next/image";

const Icons = {
  Home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Upload: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
  Results: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Reports: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  ChevronDown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  ChevronLeft: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
};

const MENU_CATEGORIES = [
  {
    title: "MENU",
    items: [
      { label: "Home", href: "/user/dashboard", icon: Icons.Home },
      { label: "Upload DNA", href: "/user/upload-dna", icon: Icons.Upload },
      { label: "My Results", href: "/user/results", icon: Icons.Results },
      { label: "Reports", href: "/user/reports", icon: Icons.Reports },
    ]
  }
];

export function UserSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    MENU: true,
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
      </nav>
    </aside>
  );
}
