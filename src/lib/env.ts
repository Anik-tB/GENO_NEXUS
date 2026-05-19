export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "geno_session",
  isProduction: process.env.NODE_ENV === "production"
};

export function hasDatabaseConfig() {
  return env.databaseUrl.length > 0;
}
