import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Using Neon's PgBouncer pooler URL (-pooler hostname) with pg.Pool causes
// "double-pooling" and connection exhaustion. Strip -pooler so we connect
// directly to Neon and let pg.Pool manage connections itself.
// Also strip channel_binding=require which PgBouncer does not support.
const rawUrl = process.env.DATABASE_URL || "";
const cleanUrl = rawUrl
  .replace(/-pooler(\.[^/]*)/, "$1")           // remove -pooler from hostname
  .replace(/[&?]channel_binding=[^&]*/g, "");  // remove channel_binding param
console.log("DATABASE_URL (sanitized):", cleanUrl.replace(/:[^:@]*@/, ":***@"));

const pool = new Pool({
  connectionString: cleanUrl,
  // Neon free tier allows up to 5 direct connections
  max: 5,
  idleTimeoutMillis: 5000,   // aggressively recycle stale connections from seeding
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,  // start keepalive probes immediately
});

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err.message);
});

export const db = drizzle(pool, { schema });
