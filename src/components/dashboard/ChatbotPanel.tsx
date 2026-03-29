"use client";

import { useState } from "react";
import styles from "./ChatbotPanel.module.css";

const INIT_MESSAGES = [
  { id: 1, role: "ai", text: "Genome Copilot online. I've analyzed your latest VCF uploads. Would you like a summary of high-risk loci?" }
];

export function ChatbotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [input, setInput] = useState("");

  const togglePanel = () => setIsOpen(!isOpen);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const newMsg = { id: Date.now(), role: "user", text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput("");

    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { id: Date.now(), role: "ai", text: "Processing biological data stream... I identify an overexpression anomaly in the current cohort." }
      ]);
    }, 1000);
  };

  if (!isOpen) {
    return (
      <button className={styles.toggleButton} onClick={togglePanel} title="Open Genome Copilot">
        <span className={styles.botIcon}>🤖</span>
        <div className={styles.pulseRing}></div>
      </button>
    );
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.statusDot}></span>
          <strong>Genome Copilot</strong>
        </div>
        <button className={styles.closeButton} onClick={togglePanel}>×</button>
      </div>

      <div className={styles.messageList}>
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.messageWrapper} ${msg.role === 'ai' ? styles.aiMsg : styles.userMsg}`}>
            <span className={styles.messageLabel}>{msg.role === 'ai' ? 'Copilot' : 'You'}</span>
            <div className={styles.bubble}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <form className={styles.inputArea} onSubmit={handleSend}>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about mutations, genes..." 
          className={styles.input}
        />
        <button type="submit" className={styles.sendButton} disabled={!input.trim()}>
          ➤
        </button>
      </form>
    </aside>
  );
}
