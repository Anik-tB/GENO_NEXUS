export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL ?? "",
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "geno_session",
  isProduction: process.env.NODE_ENV === "production"
};

export function hasDatabaseConfig() {
  return env.databaseUrl.length > 0;
}

