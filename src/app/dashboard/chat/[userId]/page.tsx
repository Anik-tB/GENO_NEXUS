"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import styles from "../Chat.module.css";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  file_url?: string | null;
  file_type?: string | null;
  created_at: string;
}

export default function ChatRoom({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const peerId = resolvedParams.userId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [myUserId, setMyUserId] = useState<string>("");
  const [peerName, setPeerName] = useState<string>("Loading...");
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myUserIdRef = useRef<string>("");
  const lastSeenRef = useRef<string | null>(null);

  // Keep ref in sync
  useEffect(() => { myUserIdRef.current = myUserId; }, [myUserId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPeerTyping]);

  // Fetch initial message history
  const fetchHistory = useCallback(async () => {
    if (!peerId) return;
    try {
      const url = `/api/chat/history?peerId=${peerId}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const incoming: Message[] = data.messages || [];

      if (incoming.length > 0) {
        setMessages(incoming);
        // Track the latest timestamp
        lastSeenRef.current = incoming[incoming.length - 1].created_at;
      }
    } catch {
      // Silently ignore errors
    }
  }, [peerId]);

  // Mark as read
  const markAsRead = useCallback(async () => {
    if (!peerId) return;
    try {
      await fetch("/api/chat/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId })
      });
      // Notify sidebar to clear badge
      window.dispatchEvent(new CustomEvent("mark_chat_read", { detail: { peerId } }));
    } catch {}
  }, [peerId]);

  useEffect(() => {
    const init = async () => {
      try {
        const [meRes, peerRes] = await Promise.all([
          fetch("/api/profile"),
          fetch(`/api/users/${peerId}`)
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          const userId = meData.profile?.id ?? meData.id;
          setMyUserId(userId);
          myUserIdRef.current = userId;
          // No local websocket init needed anymore, GlobalChatManager handles it
        }

        if (peerRes.ok) {
          const peerData = await peerRes.json();
          setPeerName(`${peerData.first_name} ${peerData.last_name}`);
        } else {
          setPeerName("Team Member");
        }
      } catch (err) {
        console.error("Failed to init chat", err);
      }

      // Initial load
      await fetchHistory();
      await markAsRead();
    };

    lastSeenRef.current = null;
    setMessages([]);
    init();

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId]);

  // Listen to GlobalChatManager events
  useEffect(() => {
    const handleGlobalMessage = (e: any) => {
      const data = e.detail;
      const me = myUserIdRef.current;

      if (data.type === "private_message") {
        if (
          (data.sender_id === me && data.receiver_id === peerId) ||
          (data.sender_id === peerId && data.receiver_id === me)
        ) {
          setMessages(prev => {
            if (prev.find(m => m.id === String(data.id))) return prev;
            
            // Remove any optimistic temp message that matches the incoming real message
            const filtered = prev.filter(m => 
              !(m.id.startsWith("temp-") && m.content === data.content && m.sender_id === data.sender_id)
            );
            
            return [...filtered, { ...data, id: String(data.id) }];
          });
          if (data.sender_id === peerId) setIsPeerTyping(false);
          
          // Mark as read immediately since we are looking at this chat
          markAsRead();
        }
      } else if (data.type === "typing" && data.sender_id === peerId) {
        setIsPeerTyping(data.typing);
        if (data.typing) {
          setTimeout(() => setIsPeerTyping(false), 3000);
        }
      }
    };

    window.addEventListener("global_chat_message", handleGlobalMessage);
    return () => window.removeEventListener("global_chat_message", handleGlobalMessage);
  }, [peerId]);

  const sendTypingSignal = (typing: boolean) => {
    window.dispatchEvent(new CustomEvent("send_ws_message", { 
      detail: { type: "typing", receiver_id: peerId, typing } 
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    sendTypingSignal(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingSignal(false), 1500);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !file) || isSending) return;

    let uploadedUrl: string | null = null;
    let uploadedType: string | null = null;

    // Step 1: Upload file if attached
    if (file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/chat/files", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          uploadedUrl = data.url;
          uploadedType = data.fileType;
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(`Failed to upload file: ${errData.error || res.statusText}`);
          setIsUploading(false);
          return;
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("Failed to upload file due to a network or server error.");
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    setIsSending(true);
    const messageContent = input.trim();
    const originalFile = file;

    setInput("");
    setFile(null);
    sendTypingSignal(false);

    // OPTIMISTIC UI: Instantly show the message on screen (0ms latency)
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: myUserIdRef.current,
      receiver_id: peerId,
      content: messageContent || null,
      file_url: uploadedUrl,
      file_type: uploadedType,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    // Send asynchronously without blocking the UI
    fetch("/api/chat/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: peerId,
        content: messageContent,
        fileUrl: uploadedUrl,
        fileType: uploadedType,
      }),
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        const saved: Message = data.message;
        lastSeenRef.current = saved.created_at;
        // GlobalChatManager handles the incoming WS broadcast to replace the temp message
      } else {
        throw new Error("Server rejected message");
      }
    }).catch((err) => {
      console.error("Failed to send message", err);
      alert("Failed to send message due to a network error.");
      
      // Rollback optimistic update
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(messageContent); 
      setFile(originalFile); 
    }).finally(() => {
      setIsSending(false);
    });
  };

  const renderMedia = (url: string, type: string) => {
    if (type.startsWith("image/")) {
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <div className={styles.messageMedia}>
          <img src={url} alt="Attachment" />
        </div>
      );
    }
    if (type.startsWith("video/")) {
      return (
        <div className={styles.messageMedia}>
          <video src={url} controls />
        </div>
      );
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
        Download File
      </a>
    );
  };

  return (
    <>
      <div className={styles.chatHeader}>
        <div className={styles.avatar}>
          {peerName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3>{peerName}</h3>
          {isPeerTyping && <span className={styles.typingSmall}>typing...</span>}
        </div>
      </div>

      <div className={styles.messagesList}>
        {messages.length === 0 && (
          <div className={styles.noMessages}>
            Say hello! This is the beginning of your conversation with {peerName}.
          </div>
        )}
        {messages.map((msg) => {
          const isSentByMe = msg.sender_id === myUserId;
          return (
            <div
              key={msg.id}
              className={`${styles.messageWrapper} ${isSentByMe ? styles.sent : styles.received}`}
            >
              <div className={styles.messageBubble}>
                {msg.content && <div>{msg.content}</div>}
                {msg.file_url && msg.file_type && renderMedia(msg.file_url, msg.file_type)}
              </div>
              <span className={styles.messageTime}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {file && (
        <div className={styles.attachmentPreview}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
          <span>{file.name}</span>
          <button className={styles.cancelAttachBtn} onClick={() => setFile(null)}>✖</button>
        </div>
      )}

      <form className={styles.inputArea} onSubmit={handleSend}>
        <label className={styles.attachBtn} title="Attach file">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
          <input
            type="file"
            className={styles.fileInput}
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
          />
        </label>

        <input
          ref={inputRef}
          type="text"
          className={styles.inputField}
          placeholder="Type a message..."
          value={input}
          onChange={handleInputChange}
          disabled={isUploading || isSending}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />

        <button
          type="submit"
          className={styles.sendBtn}
          disabled={isUploading || isSending || (!input.trim() && !file)}
        >
          {isUploading || isSending ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spinIcon}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </form>
    </>
  );
}
