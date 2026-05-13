import type { PoolClient } from "pg";
import { getPool } from "./pool";

const TABLES = [
  "users",
  "reading_challenges",
  "push_subscriptions",
  "manga_series",
  "volume_metadata",
  "manga_volumes",
  "user_to_series",
  "user_to_volumes",
  "daily_reading_logs",
  "reading_entries",
  "file_checksums",
  "genres",
  "tags",
  "volume_to_genres",
  "volume_to_tags",
] as const;

type TableName = (typeof TABLES)[number];

type BackupRow = Record<string, unknown>;

export interface BunkoBackup {
  format: "bunko-backup-v1";
  exportedAt: string;
  tables: Record<TableName, BackupRow[]>;
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, "\"\"")}"`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertBackupShape(value: unknown): asserts value is BunkoBackup {
  if (!isRecord(value)) {
    throw new Error("Invalid backup payload");
  }

  if (value.format !== "bunko-backup-v1") {
    throw new Error("Unsupported backup format");
  }

  if (!isRecord(value.tables)) {
    throw new Error("Backup tables are missing");
  }

  for (const table of TABLES) {
    if (!Array.isArray(value.tables[table])) {
      throw new Error(`Backup table "${table}" is missing or invalid`);
    }
  }
}

export async function exportDatabaseBackup(): Promise<BunkoBackup> {
  const pool = getPool();
  const tables = {} as Record<TableName, BackupRow[]>;

  for (const table of TABLES) {
    const result = await pool.query<BackupRow>(
      `SELECT * FROM ${quoteIdentifier(table)}`
    );
    tables[table] = result.rows;
  }

  return {
    format: "bunko-backup-v1",
    exportedAt: new Date().toISOString(),
    tables,
  };
}

async function insertRows(
  client: PoolClient,
  table: TableName,
  rows: BackupRow[]
) {
  for (const row of rows) {
    const entries = Object.entries(row);

    if (entries.length === 0) {
      continue;
    }

    const columns = entries.map(([key]) => quoteIdentifier(key)).join(", ");
    const placeholders = entries
      .map((_, index) => `$${index + 1}`)
      .join(", ");
    const values = entries.map(([, value]) => value);

    await client.query(
      `INSERT INTO ${quoteIdentifier(table)} (${columns}) VALUES (${placeholders})`,
      values
    );
  }
}

export async function restoreDatabaseBackup(payload: unknown): Promise<void> {
  assertBackupShape(payload);

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `TRUNCATE TABLE ${TABLES.map((table) => quoteIdentifier(table)).join(", ")} CASCADE`
    );

    for (const table of TABLES) {
      await insertRows(client, table, payload.tables[table]);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
