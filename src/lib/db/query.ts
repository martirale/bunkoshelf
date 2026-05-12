import type { QueryResultRow } from "pg";
import { getPool } from "./pool";

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function execute(
  text: string,
  params: unknown[] = []
): Promise<number> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rowCount ?? 0;
}
