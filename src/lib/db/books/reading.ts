import { createId } from "@paralleldrive/cuid2";
import { execute, query, queryOne } from "../query";

export interface BookProgress {
  id: string;
  userId: string;
  volumeId: string;
  isRead: boolean;
  isFavorite: boolean;
  personalRating: number | null;
  cfi: string | null;
  progression: number | null;
  chapterHref: string | null;
  chapterLabel: string | null;
  lastReadAt: Date | null;
  completedAt: Date | null;
}

export interface BookBookmark { id: string; cfi: string; label: string | null; chapterLabel: string | null; createdAt: Date; }
export interface BookAnnotation { id: string; cfiRange: string; excerpt: string | null; note: string | null; color: string; createdAt: Date; }
export interface BookReaderPreferences { theme: "light" | "sepia" | "dark"; flow: "paginated" | "scrolled-continuous"; fontFamily: "serif" | "sans"; fontSize: number; lineHeight: number; margin: number; columnWidth: number; }

function mapProgress(row: Record<string, unknown>): BookProgress {
  return { id: row.id as string, userId: row.user_id as string, volumeId: row.volume_id as string,
    isRead: row.is_read as boolean, isFavorite: row.is_favorite as boolean, personalRating: row.personal_rating as number | null,
    cfi: row.cfi as string | null, progression: row.progression as number | null, chapterHref: row.chapter_href as string | null,
    chapterLabel: row.chapter_label as string | null, lastReadAt: row.last_read_at as Date | null, completedAt: row.completed_at as Date | null };
}

export async function findBookProgress(userId: string, volumeId: string): Promise<BookProgress | null> {
  const row = await queryOne<Record<string, unknown>>(
    "SELECT * FROM user_to_books WHERE user_id = $1 AND volume_id = $2 LIMIT 1", [userId, volumeId]);
  return row ? mapProgress(row) : null;
}

export async function upsertBookProgress(userId: string, volumeId: string, input: Partial<Omit<BookProgress, "id" | "userId" | "volumeId">>): Promise<BookProgress> {
  const current = await findBookProgress(userId, volumeId);
  const isRead = input.isRead ?? current?.isRead ?? false;
  const completedAt = isRead && !current?.completedAt ? new Date() : current?.completedAt ?? null;
  const row = await queryOne<Record<string, unknown>>(`
    INSERT INTO user_to_books (id,user_id,volume_id,is_read,is_favorite,personal_rating,cfi,progression,chapter_href,chapter_label,last_read_at,completed_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (user_id,volume_id) DO UPDATE SET is_read=EXCLUDED.is_read,is_favorite=EXCLUDED.is_favorite,
      personal_rating=EXCLUDED.personal_rating,cfi=EXCLUDED.cfi,progression=EXCLUDED.progression,
      chapter_href=EXCLUDED.chapter_href,chapter_label=EXCLUDED.chapter_label,last_read_at=EXCLUDED.last_read_at,
      completed_at=EXCLUDED.completed_at,updated_at=NOW() RETURNING *`,
    [current?.id ?? createId(), userId, volumeId, isRead, input.isFavorite ?? current?.isFavorite ?? false,
      input.personalRating === undefined ? current?.personalRating ?? null : input.personalRating,
      input.cfi === undefined ? current?.cfi ?? null : input.cfi,
      input.progression === undefined ? current?.progression ?? null : input.progression,
      input.chapterHref === undefined ? current?.chapterHref ?? null : input.chapterHref,
      input.chapterLabel === undefined ? current?.chapterLabel ?? null : input.chapterLabel,
      input.lastReadAt === undefined ? current?.lastReadAt ?? null : input.lastReadAt,
      completedAt]);
  if (!row) throw new Error("Failed to update book progress");
  if (isRead && !current?.isRead) {
    const now = new Date();
    await execute("INSERT INTO book_reading_entries (id, user_id, volume_id, read_at) VALUES ($1,$2,$3,$4)", [createId(), userId, volumeId, now.toISOString().slice(0, 10)]);
  }
  return mapProgress(row);
}

export async function listBookBookmarks(userId: string, volumeId: string): Promise<BookBookmark[]> {
  return query<BookBookmark>(`SELECT id,cfi,label,"chapter_label" AS "chapterLabel",created_at AS "createdAt"
    FROM book_bookmarks WHERE user_id=$1 AND volume_id=$2 ORDER BY created_at DESC`, [userId, volumeId]);
}

export async function createBookBookmark(userId: string, volumeId: string, input: Omit<BookBookmark, "id" | "createdAt">): Promise<BookBookmark> {
  const row = await queryOne<BookBookmark>(`INSERT INTO book_bookmarks (id,user_id,volume_id,cfi,label,chapter_label)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,cfi,label,chapter_label AS "chapterLabel",created_at AS "createdAt"`,
    [createId(), userId, volumeId, input.cfi, input.label, input.chapterLabel]);
  if (!row) throw new Error("Failed to create bookmark");
  return row;
}

export async function deleteBookBookmark(userId: string, bookmarkId: string): Promise<void> {
  await execute("DELETE FROM book_bookmarks WHERE id=$1 AND user_id=$2", [bookmarkId, userId]);
}

export async function listBookAnnotations(userId: string, volumeId: string): Promise<BookAnnotation[]> {
  return query<BookAnnotation>(`SELECT id,cfi_range AS "cfiRange",excerpt,note,color,created_at AS "createdAt"
    FROM book_annotations WHERE user_id=$1 AND volume_id=$2 ORDER BY created_at DESC`, [userId, volumeId]);
}

export async function createBookAnnotation(userId: string, volumeId: string, input: Omit<BookAnnotation, "id" | "createdAt">): Promise<BookAnnotation> {
  const row = await queryOne<BookAnnotation>(`INSERT INTO book_annotations (id,user_id,volume_id,cfi_range,excerpt,note,color)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,cfi_range AS "cfiRange",excerpt,note,color,created_at AS "createdAt"`,
    [createId(), userId, volumeId, input.cfiRange, input.excerpt, input.note, input.color]);
  if (!row) throw new Error("Failed to create annotation");
  return row;
}

export async function deleteBookAnnotation(userId: string, annotationId: string): Promise<void> {
  await execute("DELETE FROM book_annotations WHERE id=$1 AND user_id=$2", [annotationId, userId]);
}

export async function getBookReaderPreferences(userId: string): Promise<BookReaderPreferences | null> {
  const row = await queryOne<{ theme: BookReaderPreferences["theme"]; flow: BookReaderPreferences["flow"]; font_family: BookReaderPreferences["fontFamily"]; font_size: number; line_height: number; margin: number; column_width: number }>(
    "SELECT theme,flow,font_family,font_size,line_height,margin,column_width FROM user_book_reader_preferences WHERE user_id=$1", [userId]);
  return row ? { theme: row.theme, flow: row.flow, fontFamily: row.font_family, fontSize: row.font_size, lineHeight: row.line_height, margin: row.margin, columnWidth: row.column_width } : null;
}

export async function saveBookReaderPreferences(userId: string, input: BookReaderPreferences): Promise<void> {
  await execute(`INSERT INTO user_book_reader_preferences (user_id,theme,flow,font_family,font_size,line_height,margin,column_width)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (user_id) DO UPDATE SET theme=EXCLUDED.theme,
    flow=EXCLUDED.flow,font_family=EXCLUDED.font_family,font_size=EXCLUDED.font_size,line_height=EXCLUDED.line_height,
    margin=EXCLUDED.margin,column_width=EXCLUDED.column_width,updated_at=NOW()`,
    [userId, input.theme, input.flow, input.fontFamily, input.fontSize, input.lineHeight, input.margin, input.columnWidth]);
}
