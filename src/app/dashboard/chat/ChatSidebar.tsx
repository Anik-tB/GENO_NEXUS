"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./Chat.module.css";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function ChatSidebar({ users }: { users: User[] }) {
  const pathname = usePathname();
  // Track which users have been recently active (polled from presence ping)
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  // Track unread message counts per user
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Poll for "who is online" every 10s via a simple presence check
    // We mark a user as "online" if they sent/received a message in last 5 minutes
    const checkPresence = async () => {
      try {
        const res = await fetch("/api/chat/presence");
        if (res.ok) {
          const data = await res.json();
          setOnlineIds(new Set(data.onlineIds || []));
        }
      } catch {
        // If presence endpoint doesn't exist, silently ignore
      }
    };
    checkPresence();
    const interval = setInterval(checkPresence, 10000);

    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/chat/unread");
        if (res.ok) {
          const data = await res.json();
          setUnreadCounts(data.unread || {});
        }
      } catch (err) {}
    };
    fetchUnread();

    const handleGlobalMsg = (e: any) => {
      const data = e.detail;
      if (data.type === "private_message") {
        const senderId = data.sender_id;
        // Only increment if we are not currently chatting with this user
        if (window.location.pathname !== `/dashboard/chat/${senderId}`) {
          setUnreadCounts(prev => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1
          }));
        }
      }
    };

    const handleMarkRead = (e: any) => {
      const peerId = e.detail.peerId;
      setUnreadCounts(prev => ({
        ...prev,
        [peerId]: 0
      }));
    };

    window.addEventListener("global_chat_message", handleGlobalMsg);
    window.addEventListener("mark_chat_read", handleMarkRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener("global_chat_message", handleGlobalMsg);
      window.removeEventListener("mark_chat_read", handleMarkRead);
    };
  }, []);

  const getInitials = (u: User) =>
    `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2>Messages</h2>
      </div>
      <div className={styles.userList}>
        {users.map((u) => {
          const isActive = pathname === `/dashboard/chat/${u.id}`;
          const isOnline = onlineIds.has(u.id);
          return (
            <Link
              key={u.id}
              href={`/dashboard/chat/${u.id}`}
              className={`${styles.userItem} ${isActive ? styles.active : ""}`}
            >
              <div className={`${styles.avatar} ${isOnline ? styles.avatarOnline : ""}`}>
                {getInitials(u)}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {u.first_name} {u.last_name}
                </span>
                <span className={`${styles.userStatus} ${isOnline ? styles.statusOnline : styles.statusOffline}`}>
                  {isOnline ? "● Online" : "○ Offline"}
                </span>
              </div>
              {unreadCounts[u.id] > 0 && (
                <div className={styles.unreadBadge}>
                  {unreadCounts[u.id]}
                </div>
              )}
            </Link>
          );
        })}
        {users.length === 0 && (
          <div style={{ padding: "20px", color: "#888", textAlign: "center", fontSize: "0.9rem" }}>
            No other users found.
          </div>
        )}
      </div>
    </aside>
  );
}
