import { assertDatabase } from "@/lib/db";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/auth/sessions";
import { env } from "@/lib/env";
import styles from "./Chat.module.css";
import ChatSidebar from "./ChatSidebar";

export const metadata = {
  title: "Messages | GenoNexus",
};

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.sessionCookieName)?.value;
  let currentUser = null;

  if (token) {
    currentUser = await getUserFromSessionToken(token);
  }

  const db = assertDatabase();
  const res = await db.query(
    `SELECT id, first_name, last_name, email FROM users WHERE id != $1 ORDER BY first_name ASC`,
    [currentUser?.id || "00000000-0000-0000-0000-000000000000"]
  );
  const users = res.rows;

  return (
    <div className={styles.chatLayout}>
      <ChatSidebar users={users} />
      <main className={styles.mainArea}>
        {children}
      </main>
    </div>
  );
}
