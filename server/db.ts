import { Pool, type PoolConfig } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Only strip channel_binding — it is not supported by PgBouncer.
// Keep the -pooler hostname: Neon's pooler is designed for many app connections.
// The direct endpoint (without -pooler) has very limited concurrent connections
// on the free tier, causing pool exhaustion after seeding.
const rawUrl = process.env.DATABASE_URL || "";
const cleanUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "");
console.log("DATABASE_URL (sanitized):", cleanUrl.replace(/:[^:@]*@/, ":***@"));

// The VPS resolves Neon's hostname to IPv6 which causes SSL/auth termination.
// forcing family=4 makes pg use IPv4 (same as local Windows). We cast because
// @types/pg doesn't expose this underlying net.connect option.
const poolConfig: PoolConfig = {
  connectionString: cleanUrl,
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
};
(poolConfig as any).family = 4;

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err.message);
});

export const db = drizzle(pool, { schema });
