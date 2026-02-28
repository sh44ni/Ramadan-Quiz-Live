import { Pool, type PoolConfig } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dns from "dns";
import * as schema from "@shared/schema";

// Strip -pooler (PgBouncer double-pool issue) and channel_binding (unsupported by pooler)
const rawUrl = process.env.DATABASE_URL || "";
const cleanUrl = rawUrl
  .replace(/-pooler(\.[^/]*)/, "$1")
  .replace(/[&?]channel_binding=[^&]*/g, "");
console.log("DATABASE_URL (sanitized):", cleanUrl.replace(/:[^:@]*@/, ":***@"));

// The VPS resolves Neon's hostname to IPv6, which causes pg's SSL/auth handshake
// to fail ("Connection terminated unexpectedly"). Force IPv4 via dns.lookup family=4.
// Cast needed because @types/pg doesn't expose the underlying net.connect options.
const poolConfig: PoolConfig & { family?: number } = {
  connectionString: cleanUrl,
  max: 5,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
};

// pg passes extra options to net.connect, which accepts `family`.
// We use a cast to avoid TS errors since the type definition omits it.
(poolConfig as any).family = 4;

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err.message);
});

export const db = drizzle(pool, { schema });
