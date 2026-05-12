import { createId } from "@paralleldrive/cuid2";
import { execute, query, queryOne } from "./query";

export interface VolumeProgressRow {
  id: string;
  user_id: string;
  volume_id: string;
  is_read: boolean;
  is_favorite: boolean;
  personal_rating: number | null;
  last_page: number | null;
  total_pages: number | null;
  last_read_at: Date | null;
  first_read: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ReadingEntryRow {
  id: string;
  user_id: string;
  volume_id: string;
  read_at: string;
  created_at: Date;
}

export async function findSeriesFavoriteState(
  userId: string,
  seriesId: string
): Promise<boolean> {
  const row = await queryOne<{ is_favorite: boolean }>(
    `
      SELECT is_favorite
      FROM user_to_series
      WHERE user_id = $1
        AND series_id = $2
      LIMIT 1
    `,
    [userId, seriesId]
  );

  return row?.is_favorite ?? false;
}

export async function upsertSeriesFavorite(
  userId: string,
  seriesId: string,
  isFavorite: boolean
): Promise<void> {
  await execute(
    `
      INSERT INTO user_to_series (
        id,
        user_id,
        series_id,
        is_favorite
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, series_id)
      DO UPDATE SET
        is_favorite = EXCLUDED.is_favorite,
        updated_at = NOW()
    `,
    [createId(), userId, seriesId, isFavorite]
  );
}

export async function findVolumeProgress(
  userId: string,
  volumeId: string
): Promise<VolumeProgressRow | null> {
  return queryOne<VolumeProgressRow>(
    `
      SELECT
        id,
        user_id,
        volume_id,
        is_read,
        is_favorite,
        personal_rating,
        last_page,
        total_pages,
        last_read_at,
        first_read,
        created_at,
        updated_at
      FROM user_to_volumes
      WHERE user_id = $1
        AND volume_id = $2
      LIMIT 1
    `,
    [userId, volumeId]
  );
}

export async function listVolumeRatings(
  userId: string,
  volumeIds: string[]
): Promise<Map<string, number>> {
  if (volumeIds.length === 0) {
    return new Map();
  }

  const rows = await query<{
    volume_id: string;
    personal_rating: number;
  }>(
    `
      SELECT volume_id, personal_rating
      FROM user_to_volumes
      WHERE user_id = $1
        AND volume_id = ANY($2::text[])
        AND personal_rating IS NOT NULL
    `,
    [userId, volumeIds]
  );

  return new Map(rows.map((row) => [row.volume_id, row.personal_rating]));
}

export async function upsertVolumeProgress(
  userId: string,
  volumeId: string,
  input: {
    isRead?: boolean;
    isFavorite?: boolean;
    personalRating?: number | null;
    lastPage?: number | null;
    totalPages?: number | null;
    lastReadAt?: Date | null;
    firstRead?: string | null;
  }
): Promise<void> {
  const existing = await findVolumeProgress(userId, volumeId);

  await execute(
    `
      INSERT INTO user_to_volumes (
        id,
        user_id,
        volume_id,
        is_read,
        is_favorite,
        personal_rating,
        last_page,
        total_pages,
        last_read_at,
        first_read
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id, volume_id)
      DO UPDATE SET
        is_read = EXCLUDED.is_read,
        is_favorite = EXCLUDED.is_favorite,
        personal_rating = EXCLUDED.personal_rating,
        last_page = EXCLUDED.last_page,
        total_pages = EXCLUDED.total_pages,
        last_read_at = EXCLUDED.last_read_at,
        first_read = EXCLUDED.first_read,
        updated_at = NOW()
    `,
    [
      existing?.id ?? createId(),
      userId,
      volumeId,
      input.isRead ?? existing?.is_read ?? false,
      input.isFavorite ?? existing?.is_favorite ?? false,
      input.personalRating === undefined
        ? existing?.personal_rating ?? null
        : input.personalRating,
      input.lastPage === undefined ? existing?.last_page ?? null : input.lastPage,
      input.totalPages === undefined
        ? existing?.total_pages ?? null
        : input.totalPages,
      input.lastReadAt === undefined
        ? existing?.last_read_at ?? null
        : input.lastReadAt,
      input.firstRead === undefined ? existing?.first_read ?? null : input.firstRead,
    ]
  );
}

export async function createReadingEntryRecord(
  userId: string,
  volumeId: string,
  readAt: string
): Promise<{ id: string; readAt: string } | null> {
  const row = await queryOne<{ id: string; read_at: string }>(
    `
      INSERT INTO reading_entries (
        id,
        user_id,
        volume_id,
        read_at
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, read_at
    `,
    [createId(), userId, volumeId, readAt]
  );

  return row ? { id: row.id, readAt: row.read_at } : null;
}

export async function listReadingEntries(
  userId: string,
  volumeId: string
): Promise<{ id: string; readAt: string | null }[]> {
  const rows = await query<{ id: string; read_at: string }>(
    `
      SELECT id, read_at
      FROM reading_entries
      WHERE user_id = $1
        AND volume_id = $2
      ORDER BY created_at DESC
    `,
    [userId, volumeId]
  );

  return rows.map((row) => ({
    id: row.id,
    readAt: row.read_at,
  }));
}

export async function findReadingEntryById(
  entryId: string
): Promise<ReadingEntryRow | null> {
  return queryOne<ReadingEntryRow>(
    `
      SELECT id, user_id, volume_id, read_at, created_at
      FROM reading_entries
      WHERE id = $1
      LIMIT 1
    `,
    [entryId]
  );
}

export async function updateReadingEntryRecord(
  entryId: string,
  readAt: string
): Promise<{ id: string; readAt: string } | null> {
  const row = await queryOne<{ id: string; read_at: string }>(
    `
      UPDATE reading_entries
      SET read_at = $2
      WHERE id = $1
      RETURNING id, read_at
    `,
    [entryId, readAt]
  );

  return row ? { id: row.id, readAt: row.read_at } : null;
}

export async function deleteReadingEntryRecord(entryId: string): Promise<void> {
  await execute(
    `
      DELETE FROM reading_entries
      WHERE id = $1
    `,
    [entryId]
  );
}

export async function findOldestReadingEntryDate(
  userId: string,
  volumeId: string
): Promise<string | null> {
  const row = await queryOne<{ read_at: string }>(
    `
      SELECT read_at
      FROM reading_entries
      WHERE user_id = $1
        AND volume_id = $2
      ORDER BY read_at ASC
      LIMIT 1
    `,
    [userId, volumeId]
  );

  return row?.read_at ?? null;
}

export async function incrementChallengeCompleted(
  userId: string,
  year: number
): Promise<void> {
  await execute(
    `
      INSERT INTO reading_challenges (
        id,
        user_id,
        year,
        goal,
        completed,
        notified
      )
      VALUES ($1, $2, $3, 0, 1, FALSE)
      ON CONFLICT (user_id, year)
      DO UPDATE SET
        completed = reading_challenges.completed + 1,
        updated_at = NOW()
    `,
    [createId(), userId, year]
  );
}

export async function ensureDailyReadingLog(
  userId: string,
  date: string
): Promise<void> {
  await execute(
    `
      INSERT INTO daily_reading_logs (
        id,
        user_id,
        date
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, date)
      DO NOTHING
    `,
    [createId(), userId, date]
  );
}
