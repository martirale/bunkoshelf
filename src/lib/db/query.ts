import type { QueryResult, QueryResultRow } from "pg";
import { getPool } from "./pool";

function isRetryableConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("connection terminated due to connection timeout") ||
    message.includes("timeout exceeded when trying to connect") ||
    message.includes("connect econnrefused") ||
    message.includes("the database system is starting up")
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runQuery<T extends QueryResultRow>(
  text: string,
  params: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPool();

  try {
    return await pool.query<T>(text, params);
  } catch (error) {
    if (!isRetryableConnectionError(error)) throw error;

    await wait(150);
    return pool.query<T>(text, params);
  }
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await runQuery<T>(text, params);
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
  const result = await runQuery(text, params);
  return result.rowCount ?? 0;
}
