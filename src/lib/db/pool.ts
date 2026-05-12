import pg from "pg";

pg.types.setTypeParser(1114, (value: string) =>
  value ? new Date(value.replace(" ", "T") + "Z") : null
);

pg.types.setTypeParser(1700, (value: string) =>
  value !== null ? parseFloat(value) : null
);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

const pool = new pg.Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (error: Error) => {
  console.error("[bunko/db] Unexpected pool error:", error.message);
  process.exit(1);
});

export default pool;
