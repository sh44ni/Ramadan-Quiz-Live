import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Remove channel_binding=require — it is incompatible with Neon's PgBouncer pooler
// and causes "Connection terminated due to connection timeout" errors.
const rawUrl = process.env.DATABASE_URL || "";
const cleanUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "");
console.log("DATABASE_URL (sanitized):", cleanUrl.replace(/:[^:@]*@/, ":***@"));

const pool = new Pool({
  connectionString: cleanUrl,
  // Stay within Neon free-tier connection limits
  max: 3,
  // Give idle connections 30s before closing
  idleTimeoutMillis: 30000,
  // Allow up to 10s to acquire a connection before failing
  connectionTimeoutMillis: 10000,
  // Send keepalive packets so the OS/proxy doesn't silently drop idle connections
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err.message);
});

export const db = drizzle(pool, { schema });
