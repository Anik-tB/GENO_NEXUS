import { Pool } from "pg";
import { env, hasDatabaseConfig } from "@/lib/env";

export type DatabaseQueryExecutor = Pick<Pool, "query">;

declare global {
  var __genonexusPool__: Pool | undefined;
}

function createPool() {
  return new Pool({
    connectionString: env.databaseUrl,
    ssl: env.isProduction ? { rejectUnauthorized: false } : undefined
  });
}

export const db = hasDatabaseConfig()
  ? global.__genonexusPool__ ?? (global.__genonexusPool__ = createPool())
  : null;

export function assertDatabase() {
  if (!db) {
    throw new Error("DATABASE_NOT_CONFIGURED");
  }

  return db;
}
