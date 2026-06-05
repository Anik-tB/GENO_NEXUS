"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import styles from "@/components/dashboard/TopNav.module.css";
import Image from "next/image";

interface TopNavProps {
  userInitials: string;
  userName: string;
  userEmail: string;
}

export function UserTopNav({ userInitials, userName, userEmail }: TopNavProps) {
  const router = useRouter();
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [lang, setLang] = useState("en");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") || "dark";
    setTheme(saved);
    if (saved === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    const handleThemeEvent = () => {
       const updated = localStorage.getItem("theme") || "dark";
       setTheme(updated);
    };
    window.addEventListener("themeChange", handleThemeEvent);

    // Initialise language
    const savedLang = localStorage.getItem("language") || "en";
    setLang(savedLang);

    const handleLangEvent = () => {
      const updated = localStorage.getItem("language") || "en";
      setLang(updated);
    };
    window.addEventListener("languageChange", handleLangEvent);

    return () => {
      window.removeEventListener("themeChange", handleThemeEvent);
      window.removeEventListener("languageChange", handleLangEvent);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    window.dispatchEvent(new Event("themeChange"));
  };

  const toggleLanguage = () => {
    const next = lang === "en" ? "bn" : "en";
    setLang(next);
    localStorage.setItem("language", next);
    window.dispatchEvent(new Event("languageChange"));
  };

  const handleNavigation = (path: string) => {
    setIsProfileOpen(false);
    setTimeout(() => {
      router.push(path);
    }, 0);
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    // Force a full page reload to clear the client-side Next.js App Router cache
    window.location.href = '/login';
  };

  const [timeString, setTimeString] = useState("12:37 PM, Wed");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: any) => !n.is_read).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'PATCH' });
      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        setIsNotifOpen(false);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + 
           date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim() !== "") {
        setIsSearching(true);
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => res.json())
          .then(data => {
            setSearchResults(data.results || []);
            setIsSearching(false);
            setShowSearchDropdown(true);
          })
          .catch(err => {
            console.error("Search error:", err);
            setIsSearching(false);
          });
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const dayStr = now.toLocaleDateString('en-US', { weekday: 'short' });
      setTimeString(`${formattedTime}, ${dayStr}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.spacer} /> {/* Pushes content to the right */}

      <div className={styles.tools}>
        <div className={styles.infoPill}>
          <div 
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
            onClick={() => router.push('/user/reports')}
            title="Open Reports"
          >
            <svg className={styles.pillIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span style={{ transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "var(--gn-primary)"} onMouseOut={e => e.currentTarget.style.color = ""}>Reports</span>
          </div>
          <div className={styles.pillDivider} />
          <svg className={styles.pillIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>{timeString}</span>
        </div>

        <div className={styles.searchContainer} ref={searchRef}>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim() !== "") setShowSearchDropdown(true);
            }}
          />
          {showSearchDropdown && (
            <div className={styles.searchResultsDropdown}>
              {isSearching ? (
                <div className={styles.searchLoading}>Searching...</div>
              ) : searchResults.length > 0 ? (
                <ul className={styles.resultsList}>
                  {searchResults.map((result) => (
                    <li 
                      key={result.id} 
                      className={styles.resultItem}
                      onClick={() => {
                        setShowSearchDropdown(false);
                        // Future implementation for navigation
                      }}
                    >
                      <span className={styles.resultTitle}>{result.title}</span>
                      <span className={styles.resultType}>{result.type}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.noResults}>No results found</div>
              )}
            </div>
          )}
        </div>

        <button 
          className={styles.iconButton} 
          aria-label="Toggle Language" 
          onClick={toggleLanguage}
          style={{ width: "auto", height: "38px", borderRadius: "20px", padding: "0 0.8rem", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 700, border: "1px solid var(--gn-surface-border)", color: "var(--gn-text-secondary)", transition: "all 0.2s" }}
          title={lang === "en" ? "Switch to Bengali" : "ইংরেজি পরিবর্তন করুন"}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span>{lang === "en" ? "EN" : "বাং"}</span>
        </button>

        <button className={styles.iconButton} aria-label="Toggle Theme" onClick={toggleTheme}>
          {mounted ? (
            theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          )}
        </button>
        <div className={styles.notificationContainer} ref={notifRef}>
          <button 
            className={styles.iconButton} 
            aria-label="Notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>

          {isNotifOpen && (
            <div className={styles.notificationDropdown}>
              <div className={styles.notificationHeader}>
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button className={styles.markAllBtn} onClick={markAllAsRead}>
                    Mark all as read
                  </button>
                )}
              </div>
              <div className={styles.notificationList}>
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`${styles.notificationItem} ${!notif.is_read ? styles.unread : ''}`}
                      onClick={() => {
                        if (!notif.is_read) markAsRead(notif.id);
                        
                        let targetLink = notif.link;
                        if (targetLink) {
                            if (targetLink.startsWith('/dashboard/upload')) {
                                targetLink = '/user/upload-dna';
                            } else if (targetLink.startsWith('/dashboard/results/')) {
                                targetLink = '/user/results';
                            } else if (targetLink.startsWith('/dashboard/')) {
                                targetLink = targetLink.replace('/dashboard/', '/user/');
                            }
                        } else {
                           const title = notif.title || "";
                           if (title.includes("Report")) targetLink = "/user/reports";
                           else if (title.includes("Analysis") || title.includes("Compare") || title.includes("Match")) targetLink = "/user/results";
                           else if (title.includes("Sequence") || title.includes("Reference") || title.includes("Upload")) targetLink = "/user/upload-dna";
                           else targetLink = "/user/dashboard";
                        }

                        if (targetLink) {
                          setIsNotifOpen(false);
                          setTimeout(() => {
                            router.push(targetLink);
                          }, 0);
                        }
                      }}
                    >
                      {!notif.is_read && <div className={styles.unreadDot} />}
                      <span className={styles.notifTitle}>{notif.title}</span>
                      <span className={styles.notifMessage}>{notif.message}</span>
                      <span className={styles.notifTime}>{formatTime(notif.created_at)}</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyNotifications}>
                    <p>No notifications yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.profileContainer} ref={profileRef}>
          <button 
            className={styles.profile} 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-label="User Menu"
            title="Profile & Settings"
          >
            <div className={styles.avatar}>
              {userInitials}
            </div>
          </button>

          {isProfileOpen && (
            <div className={styles.profileDropdown}>
              <div className={styles.profileHeader}>
                <p className={styles.profileName}>{userName}</p>
                <p className={styles.profileEmail}>{userEmail}</p>
              </div>
              <div className={styles.dropdownDivider} />
              
              <button 
                className={styles.dropdownItem} 
                onClick={() => handleNavigation('/user/profile')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Profile
              </button>
              
              <div className={styles.dropdownDivider} />

              <button 
                className={styles.dropdownItem} 
                style={{ color: 'var(--gn-danger)' }}
                onClick={handleLogout}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
