import pg from "pg";

pg.types.setTypeParser(1114, (value: string) =>
  value ? new Date(value.replace(" ", "T") + "Z") : null
);

pg.types.setTypeParser(1700, (value: string) =>
  value !== null ? parseFloat(value) : null
);

const globalForPool = globalThis as typeof globalThis & {
  bunkoPool?: pg.Pool;
};

export function getPool(): pg.Pool {
  if (globalForPool.bunkoPool) {
    return globalForPool.bunkoPool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  const pool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on("error", (error: Error) => {
    console.error("[bunko/db] Unexpected pool error:", error.message);
  });

  globalForPool.bunkoPool = pool;
  return pool;
}
