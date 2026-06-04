import styles from "./Chat.module.css";

export default function ChatPage() {
  return (
    <div className={styles.emptyState}>
      <p>Select a conversation to start chatting</p>
    </div>
  );
}
