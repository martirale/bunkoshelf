import { getPool } from "./pool";
import { query } from "./query";

export async function withLibraryStorageLock<T>(work: () => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  const lock = 16402861;
  let held = false;
  let releaseError: Error | undefined;
  try {
    const result = await client.query<{ locked: boolean }>("SELECT pg_try_advisory_lock($1) AS locked", [lock]);
    held = result.rows[0]?.locked === true;
    if (!held) throw new Error("busy");
    return await work();
  } finally {
    try {
      if (held) await client.query("SELECT pg_advisory_unlock($1)", [lock]);
    } catch (error) {
      releaseError = error instanceof Error ? error : new Error("Failed to release library storage lock");
    } finally {
      client.release(releaseError);
    }
  }
}

export async function getConversionPathFilter() {
  const rows = await query<{ path: string }>(
    "SELECT CASE WHEN committed THEN source_path ELSE target_path END AS path FROM library_conversions",
  );
  return (path: string) => rows.some((row) => path === row.path || path.startsWith(`${row.path}/`));
}
