import { createId } from "@paralleldrive/cuid2";
import { buildNaturalSortKey } from "@/lib/naturalSort";
import { validateLogicalSeries, type LogicalSeriesInput, type LogicalSeriesOption, type LogicalSeriesDetails, type LogicalSeriesSection } from "@/lib/logicalSeries";
import { getPool } from "./pool";
import { query, queryOne } from "./query";

export async function listLogicalSeriesOptions(currentSeriesId?: string): Promise<LogicalSeriesOption[]> {
  return query<LogicalSeriesOption>(`
    SELECT s.id, s.title, s.library_section AS section, COUNT(v.id)::int AS "volumeCount"
    FROM library_series s JOIN library_volumes v ON v.series_id = s.id
    WHERE s.is_logical = FALSE AND s.is_oneshot = FALSE
      AND NOT EXISTS (SELECT 1 FROM logical_series_members m WHERE m.series_id = s.id AND ($1::text IS NULL OR m.logical_series_id <> $1))
    GROUP BY s.id
    UNION ALL
    SELECT s.id, s.title, 'books' AS section, COUNT(v.id)::int AS "volumeCount"
    FROM book_series s JOIN book_volumes v ON v.series_id = s.id
    WHERE s.is_logical = FALSE AND s.is_oneshot = FALSE AND s.library_section = 'books'
      AND NOT EXISTS (SELECT 1 FROM logical_book_series_members m WHERE m.series_id = s.id AND ($1::text IS NULL OR m.logical_series_id <> $1))
    GROUP BY s.id
    ORDER BY title, id
  `, [currentSeriesId ?? null]);
}

export async function findLogicalSeriesForEdit(id: string, section: LogicalSeriesSection): Promise<LogicalSeriesDetails | null> {
  const table = section === "books" ? "book_series" : "library_series";
  const membersTable = section === "books" ? "logical_book_series_members" : "logical_series_members";
  const series = await queryOne<{ id: string; title: string; section: LogicalSeriesSection }>(`
    SELECT id, title, library_section AS section FROM ${table}
    WHERE id = $1 AND library_section = $2 AND is_logical = TRUE
  `, [id, section]);
  if (!series) return null;
  const members = await query<{ id: string; position: number }>(`
    SELECT series_id AS id, position FROM ${membersTable}
    WHERE logical_series_id = $1 ORDER BY position
  `, [id]);
  return { ...series, members };
}

export async function updateLogicalSeriesRecord(id: string, input: LogicalSeriesInput): Promise<void> {
  if (typeof id !== "string" || !id || !validateLogicalSeries(input)) throw new Error("Invalid logical series");
  const table = input.section === "books" ? "book_series" : "library_series";
  const membersTable = input.section === "books" ? "logical_book_series_members" : "logical_series_members";
  const volumesTable = input.section === "books" ? "book_volumes" : "library_volumes";
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(`
      SELECT id FROM ${table}
      WHERE id = $1 AND library_section = $2 AND is_logical = TRUE FOR UPDATE
    `, [id, input.section]);
    if (existing.rowCount !== 1) throw new Error("Logical series not found");
    const ids = input.members.map((member) => member.id);
    const selected = await client.query(`
      SELECT s.id FROM ${table} s
      WHERE s.id = ANY($1::text[]) AND s.library_section = $2
        AND s.is_logical = FALSE AND s.is_oneshot = FALSE
        AND EXISTS (SELECT 1 FROM ${volumesTable} v WHERE v.series_id = s.id)
        AND NOT EXISTS (SELECT 1 FROM ${membersTable} m WHERE m.series_id = s.id AND m.logical_series_id <> $3)
      ORDER BY s.id FOR UPDATE OF s
    `, [ids, input.section, id]);
    if (selected.rowCount !== ids.length) throw new Error("Unavailable series");
    await client.query(`DELETE FROM ${membersTable} WHERE logical_series_id = $1`, [id]);
    await client.query(`
      INSERT INTO ${membersTable} (logical_series_id, series_id, position)
      SELECT $1, member.id, member.position
      FROM jsonb_to_recordset($2::jsonb) AS member(id text, position integer)
    `, [id, JSON.stringify(input.members)]);
    await client.query(`
      UPDATE ${table} SET title = $2, sort_title = $3, updated_at = NOW() WHERE id = $1
    `, [id, input.title.trim(), buildNaturalSortKey(input.title.trim())]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createLogicalSeriesRecord(input: LogicalSeriesInput): Promise<void> {
  if (!validateLogicalSeries(input)) throw new Error("Invalid logical series");
  const table = input.section === "books" ? "book_series" : "library_series";
  const membersTable = input.section === "books" ? "logical_book_series_members" : "logical_series_members";
  const volumesTable = input.section === "books" ? "book_volumes" : "library_volumes";
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const ids = input.members.map((member) => member.id);
    const selected = await client.query<{ id: string }>(`
      SELECT s.id FROM ${table} s
      WHERE s.id = ANY($1::text[]) AND s.library_section = $2
        AND s.is_logical = FALSE AND s.is_oneshot = FALSE
        AND EXISTS (SELECT 1 FROM ${volumesTable} v WHERE v.series_id = s.id)
        AND NOT EXISTS (SELECT 1 FROM ${membersTable} m WHERE m.series_id = s.id)
      ORDER BY s.id FOR UPDATE OF s
    `, [ids, input.section]);
    if (selected.rowCount !== ids.length) throw new Error("Unavailable series");
    const id = createId();
    const title = input.title.trim();
    await client.query(`
      INSERT INTO ${table} (id, slug, title, sort_title, path, library_section, is_logical)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE)
    `, [id, `logical-${id}`, title, buildNaturalSortKey(title), `logical:${id}`, input.section]);
    await client.query(`
      INSERT INTO ${membersTable} (logical_series_id, series_id, position)
      SELECT $1, member.id, member.position
      FROM jsonb_to_recordset($2::jsonb) AS member(id text, position integer)
    `, [id, JSON.stringify(input.members)]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
