import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createId } from "@paralleldrive/cuid2";
import pool from "./pool.mjs";

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS bunko_migrations (
      id TEXT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query(
    "SELECT filename FROM bunko_migrations ORDER BY filename"
  );

  return new Set(rows.map((row) => row.filename));
}

export async function migrate({ migrationsDir }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await ensureMigrationsTable(client);

    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    const appliedMigrations = await getAppliedMigrations(client);

    for (const file of files) {
      if (appliedMigrations.has(file)) {
        continue;
      }

      const sql = await readFile(join(migrationsDir, file), "utf8");
      await client.query(sql);
      await client.query(
        "INSERT INTO bunko_migrations (id, filename) VALUES ($1, $2)",
        [createId(), file]
      );
      console.log(`[bunko/db] Applied migration: ${file}`);
    }

    await client.query("COMMIT");
    console.log("[bunko/db] Migrations up to date.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
