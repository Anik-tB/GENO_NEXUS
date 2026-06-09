"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface MessagePayload {
  id: string;
  type: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  file_url?: string;
  file_type?: string;
}

export function GlobalChatManager() {
  const pathname = usePathname();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const [toast, setToast] = useState<{ id: string; senderId: string; content: string } | null>(null);

  useEffect(() => {
    let active = true;

    const connectWs = async () => {
      try {
        // Fetch current user ID to connect to WS
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = await res.json();
        const userId = data.profile?.id || data.id;
        
        if (!userId || !active) return;

        const wsBase = process.env.NEXT_PUBLIC_PYTHON_WS_URL || "ws://127.0.0.1:8000";
        const socket = new WebSocket(`${wsBase}/ws/chat/${userId}`);
        wsRef.current = socket;

        socket.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Dispatch a global event so active ChatRooms can update instantly
            if (data.type === "private_message" || data.type === "typing") {
              window.dispatchEvent(new CustomEvent("global_chat_message", { detail: data }));
            }

            // Trigger notification logic if it's a new message
            if (data.type === "private_message" && data.sender_id !== userId) {
              const chatPath = `/dashboard/chat/${data.sender_id}`;
              
              // If the user is NOT currently looking at the chat room with this sender
              if (!window.location.pathname.startsWith(chatPath)) {
                // Show toast notification
                setToast({
                  id: String(data.id),
                  senderId: data.sender_id,
                  content: data.content || "Sent an attachment"
                });
                
                // Auto hide after 5 seconds
                setTimeout(() => setToast(null), 5000);
              }
            }
          } catch (err) {
            console.error("Failed to parse WS message", err);
          }
        };

        socket.onclose = () => {
          if (active) {
            // Reconnect logic after 3 seconds
            setTimeout(connectWs, 3000);
          }
        };
      } catch (err) {
        console.error("Failed to init global WS", err);
      }
    };

    connectWs();

    const handleOutboundMessage = (e: any) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(e.detail));
      }
    };

    window.addEventListener("send_ws_message", handleOutboundMessage);

    return () => {
      active = false;
      window.removeEventListener("send_ws_message", handleOutboundMessage);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  if (!toast) return null;

  return (
    <div 
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        backgroundColor: "var(--gn-paper)",
        border: "1px solid var(--gn-primary)",
        boxShadow: "var(--shadow-card)",
        borderRadius: "var(--border-radius-md)",
        padding: "16px 20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minWidth: "280px",
        maxWidth: "350px",
        animation: "fadeInUp 0.3s ease-out forwards",
        cursor: "pointer"
      }}
      onClick={() => {
        router.push(`/dashboard/chat/${toast.senderId}`);
        setToast(null);
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ 
            display: "inline-block", 
            width: "8px", 
            height: "8px", 
            borderRadius: "50%", 
            backgroundColor: "var(--gn-primary)",
            boxShadow: "0 0 8px var(--gn-primary-glow)"
          }}></span>
          <strong style={{ color: "var(--gn-primary)", fontSize: "0.95rem" }}>New Message</strong>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setToast(null); }}
          style={{ background: "none", border: "none", color: "var(--gn-text-muted)", cursor: "pointer", fontSize: "1rem", padding: "0" }}
        >
          ✖
        </button>
      </div>
      <div style={{ color: "var(--gn-text-primary)", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingLeft: "16px" }}>
        {toast.content}
      </div>
    </div>
  );
}
