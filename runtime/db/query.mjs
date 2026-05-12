import { getPool } from "./pool.mjs";

export async function query(text, params = []) {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows;
}

export async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] ?? null;
}
