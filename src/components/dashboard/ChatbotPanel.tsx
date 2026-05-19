"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import styles from "./ChatbotPanel.module.css";

type ChatRole = "ai" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  suggestions?: string[];
};

type CopilotApiResponse = {
  success?: boolean;
  reply?: string;
  suggestions?: string[];
  error?: string;
};

const INITIAL_MESSAGE: ChatMessage = {
  id: "initial",
  role: "ai",
  text: "Genome Copilot online. Open the panel and I will connect to your latest analysis data.",
};

function createMessage(role: ChatRole, text: string, suggestions?: string[]): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    text,
    suggestions,
  };
}

function getErrorMessage(status: number, fallback?: string) {
  if (status === 401) return "Your session expired. Please sign in again to use Genome Copilot.";
  if (status === 429) return fallback ?? "Genome Copilot is receiving too many requests. Please wait a moment.";
  return fallback ?? "Genome Copilot could not reach the backend. Please try again.";
}

function CopilotIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 18.5 7v7L12 17.5 5.5 14V7L12 3.5Z" />
      <path d="M8.5 8.4 12 6.5l3.5 1.9M8.5 12.4l3.5 1.9 3.5-1.9M12 10.1v4.2" />
      <circle cx="5.5" cy="7" r="1.8" />
      <circle cx="18.5" cy="7" r="1.8" />
      <circle cx="12" cy="17.5" r="1.8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 12h13" />
      <path d="m13 6.5 5.5 5.5-5.5 5.5" />
    </svg>
  );
}

export function ChatbotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isBooting, setIsBooting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasLoadedGreeting, setHasLoadedGreeting] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || hasLoadedGreeting) return;

    const controller = new AbortController();

    async function loadGreeting() {
      setIsBooting(true);
      try {
        const response = await fetch("/api/copilot", {
          method: "GET",
          signal: controller.signal,
        });
        const data = (await response.json()) as CopilotApiResponse;

        if (!response.ok) {
          throw new Error(getErrorMessage(response.status, data.error));
        }

        setMessages([
          createMessage(
            "ai",
            data.reply ?? "Genome Copilot is ready, but I could not find a summary yet.",
            data.suggestions,
          ),
        ]);
        setHasLoadedGreeting(true);
      } catch (error) {
        if (controller.signal.aborted) return;
        setMessages([
          createMessage(
            "ai",
            error instanceof Error ? error.message : "Genome Copilot could not start.",
          ),
        ]);
      } finally {
        if (!controller.signal.aborted) setIsBooting(false);
      }
    }

    void loadGreeting();

    return () => controller.abort();
  }, [hasLoadedGreeting, isOpen]);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, isOpen, isSending]);

  const togglePanel = () => setIsOpen((current) => !current);

  async function sendMessage(rawMessage: string) {
    const trimmed = rawMessage.trim();
    if (!trimmed || isSending) return;

    const userMessage = createMessage("user", trimmed);
    const history = messages.slice(-10).map((message) => ({
      role: message.role,
      text: message.text,
    }));

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = (await response.json()) as CopilotApiResponse;

      if (!response.ok) {
        throw new Error(getErrorMessage(response.status, data.error));
      }

      setMessages((current) => [
        ...current,
        createMessage("ai", data.reply ?? "I could not generate a grounded answer for that yet.", data.suggestions),
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        createMessage(
          "ai",
          error instanceof Error
            ? error.message
            : "Genome Copilot hit an unexpected backend error.",
        ),
      ]);
    } finally {
      setIsSending(false);
    }
  }

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  if (!isOpen) {
    return (
      <button
        className={styles.toggleButton}
        onClick={togglePanel}
        title="Open Genome Copilot"
        aria-label="Open Genome Copilot"
      >
        <span className={styles.botIcon} aria-hidden="true">
          <CopilotIcon />
        </span>
        <span className={styles.pulseRing} aria-hidden="true"></span>
      </button>
    );
  }

  return (
    <aside className={styles.panel} aria-label="Genome Copilot">
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.assistantMark} aria-hidden="true">
            <CopilotIcon />
          </span>
          <div className={styles.titleBlock}>
            <strong>Genome Copilot</strong>
            <span>Clinical genomics assistant</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.statusPill}>
            <span className={styles.statusDot}></span>
            Online
          </span>
          <button className={styles.closeButton} onClick={togglePanel} aria-label="Close Genome Copilot">
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className={styles.messageList} ref={messageListRef} aria-live="polite">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.messageWrapper} ${msg.role === "ai" ? styles.aiMsg : styles.userMsg}`}
          >
            {msg.role === "ai" && (
              <span className={`${styles.messageAvatar} ${styles.aiAvatar}`} aria-hidden="true">
                <CopilotIcon />
              </span>
            )}
            <div className={styles.messageContent}>
              <span className={styles.messageLabel}>{msg.role === "ai" ? "Copilot" : "You"}</span>
              <div className={styles.bubble}>{msg.text}</div>
              {msg.role === "ai" && msg.suggestions && msg.suggestions.length > 0 && (
                <div className={styles.suggestions}>
                  {msg.suggestions.map((suggestion) => (
                    <button
                      className={styles.suggestionButton}
                      key={suggestion}
                      type="button"
                      onClick={() => void sendMessage(suggestion)}
                      disabled={isSending}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <span className={`${styles.messageAvatar} ${styles.userAvatar}`} aria-hidden="true">
                Y
              </span>
            )}
          </div>
        ))}
        {(isSending || isBooting) && (
          <div className={`${styles.messageWrapper} ${styles.aiMsg}`}>
            <span className={`${styles.messageAvatar} ${styles.aiAvatar}`} aria-hidden="true">
              <CopilotIcon />
            </span>
            <div className={styles.messageContent}>
              <span className={styles.messageLabel}>Copilot</span>
              <div className={`${styles.bubble} ${styles.typingBubble}`}>
                <span>Reading genomic context</span>
                <span className={styles.typingDots} aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form className={styles.inputArea} onSubmit={handleSend}>
        <div className={styles.composer}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Ask about mutations, genes..."
            className={styles.input}
            disabled={isSending || isBooting}
            rows={1}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!input.trim() || isSending || isBooting}
            aria-label="Send message"
            title="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </aside>
  );
}
