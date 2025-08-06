import { drizzle } from "drizzle-orm/node-postgres";
import { Client, Pool } from "pg";
import * as schema from "../schema/index.js";

export type DB = ReturnType<typeof createDrizzleClient>;

interface DatabaseConfig {
  connectionString: string;
  ssl?: boolean;
  max?: number; // For connection pooling
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * Creates a Drizzle client with a single connection
 * Best for Lambda functions with short execution times
 */
export function createDrizzleClient(config: DatabaseConfig | string) {
  const connectionString =
    typeof config === "string" ? config : config.connectionString;

  const client = new Client({
    connectionString,
    ssl:
      typeof config === "object" && config.ssl
        ? { rejectUnauthorized: false }
        : false,
  });

  // Important: Connect the client
  client.connect().catch(console.error);

  return drizzle(client, { schema });
}

/**
 * Creates a Drizzle client with connection pooling
 * Best for long-running services like NestJS servers
 */
export function createDrizzlePool(config: DatabaseConfig | string) {
  const connectionConfig =
    typeof config === "string" ? { connectionString: config } : config;

  const pool = new Pool({
    connectionString: connectionConfig.connectionString,
    ssl: connectionConfig.ssl ? { rejectUnauthorized: false } : false,
    max: connectionConfig.max ?? 20,
    idleTimeoutMillis: connectionConfig.idleTimeoutMillis ?? 30000,
    connectionTimeoutMillis: connectionConfig.connectionTimeoutMillis ?? 2000,
  });

  // Handle pool errors
  pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
  });

  return drizzle(pool, { schema });
}

/**
 * Default client for backwards compatibility
 * Uses environment variable DATABASE_URL
 */
export function createDefaultClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  return createDrizzlePool(databaseUrl);
}

// Export types for convenience
export type { Client, Pool } from "pg";
