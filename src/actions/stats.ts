"use server";

import { verifySession } from "@/lib/auth/verifySession";
import { query, queryOne } from "@/lib/db/query";

interface GenreStat {
  genre: string;
  user: number;
}

interface MonthlyRead {
  month: number;
  count: number;
}

export async function getGenresStats() {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    const ignoreList = [
      "shonen",
      "shojo",
      "seinen",
      "josei",
      "kodomo",
      "manhwa",
      "manhua",
      "webcomic",
      "doujinshi",
      "color",
      "oneshot",
    ];
    const ignoreSet = new Set(ignoreList.map((s) => s.toLowerCase()));

    const readVolumes = await query<{ volume_id: string }>(
      `
        SELECT volume_id
        FROM user_to_volumes
        WHERE user_id = $1
          AND is_read = TRUE
      `,
      [user.id]
    );

    const readVolumeIds = readVolumes.map((v) => v.volume_id);

    if (readVolumeIds.length === 0) {
      return { topGenres: [] as GenreStat[] };
    }

    const [genres, tags] = await Promise.all([
      query<{
        volume_id: string;
        genre_name: string;
      }>(
        `
          SELECT vtg.volume_id, g.name AS genre_name
          FROM volume_to_genres vtg
          INNER JOIN genres g ON g.id = vtg.genre_id
          WHERE vtg.volume_id = ANY($1::text[])
        `,
        [readVolumeIds]
      ),
      query<{
        volume_id: string;
        tag_name: string;
      }>(
        `
          SELECT vtt.volume_id, t.name AS tag_name
          FROM volume_to_tags vtt
          INNER JOIN tags t ON t.id = vtt.tag_id
          WHERE vtt.volume_id = ANY($1::text[])
        `,
        [readVolumeIds]
      ),
    ]);

    const volumeNames = new Map<string, Set<string>>();
    const displayMap = new Map<string, string>();

    for (const entry of genres) {
      const id = entry.volume_id;
      const name = String(entry.genre_name || "").trim();
      const key = name.toLowerCase();
      if (!displayMap.has(key)) displayMap.set(key, name);
      if (!volumeNames.has(id)) volumeNames.set(id, new Set());
      volumeNames.get(id)!.add(key);
    }

    for (const entry of tags) {
      const id = entry.volume_id;
      const name = String(entry.tag_name || "").trim();
      const key = name.toLowerCase();
      if (ignoreSet.has(key)) continue;
      if (!displayMap.has(key)) displayMap.set(key, name);
      if (!volumeNames.has(id)) volumeNames.set(id, new Set());
      volumeNames.get(id)!.add(key);
    }

    const countMap = new Map<string, number>();

    for (const names of volumeNames.values()) {
      for (const key of names) {
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }
    }

    const sorted: GenreStat[] = Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({
        genre: displayMap.get(key) || key,
        user: count,
      }));

    return { topGenres: sorted };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error fetching top genres:", error);
      return {
        error: "Internal Server Error",
        status: 500,
      };
    }
  }
}

export async function getReaderStats() {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const volumesRead = await query<{
    id: string;
    volume_id: string;
    last_read_at: Date | null;
  }>(
    `
      SELECT id, volume_id, last_read_at
      FROM user_to_volumes
      WHERE user_id = $1
        AND is_read = TRUE
    `,
    [user.id]
  );

  const allReadDates = await query<{ last_read_at: Date | null }>(
    `
      SELECT last_read_at
      FROM user_to_volumes
      WHERE user_id = $1
        AND last_read_at IS NOT NULL
      ORDER BY last_read_at DESC
    `,
    [user.id]
  );

  const dailyReading = await query<{ date: string }>(
    `
      SELECT date
      FROM daily_reading_logs
      WHERE user_id = $1
      ORDER BY date DESC
    `,
    [user.id]
  );

  const totalVolumes = await queryOne<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM manga_volumes
    `
  );

  const totalSeries = await queryOne<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM manga_series
      WHERE is_oneshot = FALSE
    `
  );

  const userProgressVolumes = await query<{ is_read: boolean }>(
    `
      SELECT utv.is_read
      FROM manga_volumes mv
      INNER JOIN user_to_volumes utv
        ON utv.volume_id = mv.id
      WHERE utv.user_id = $1
    `,
    [user.id]
  );

  const allFirstReadDates = await query<{ first_read: string | null }>(
    `
      SELECT first_read
      FROM user_to_volumes
      WHERE user_id = $1
        AND first_read IS NOT NULL
    `,
    [user.id]
  );

  const currentChallenge = await queryOne<{ goal: number }>(
    `
      SELECT goal
      FROM reading_challenges
      WHERE user_id = $1
        AND year = $2
      LIMIT 1
    `,
    [user.id, new Date().getFullYear()]
  );

  const readEntries = allReadDates;
  const allCompleted = volumesRead.map(({ id, volume_id }) => ({
    id,
    volume_id,
  }));

  const totalTracked = userProgressVolumes.length;
  const totalRead = userProgressVolumes.filter((volume) => volume.is_read).length;
  const totalUnread = Number(totalVolumes?.count ?? 0) - totalRead;

  const now = new Date();
  const monthlyReadCount = Array(12).fill(0) as number[];

  for (const entry of allFirstReadDates) {
    const [yearStr, monthStr] = entry.first_read!.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);

    if (year === now.getFullYear() && month >= 1 && month <= 12) {
      monthlyReadCount[month - 1]++;
    }
  }

  const monthlyReads: MonthlyRead[] = monthlyReadCount
    .map((count, index) => ({
      month: index + 1,
      count,
    }))
    .filter((_, index) => index <= now.getMonth());

  const goal = currentChallenge?.goal || 0;
  let monthlyGoal: number | null = null;

  if (goal > 0) {
    const currentMonth = now.getMonth() + 1;
    const basePerMonth = Math.floor(goal / 12);
    const remainder = goal % 12;
    const extraStart = 12 - remainder + 1;

    let cumulativeExpected = 0;
    for (let m = 1; m <= currentMonth; m++) {
      cumulativeExpected += basePerMonth + (m >= extraStart ? 1 : 0);
    }

    const previousMonthsRead = monthlyReads
      .filter((entry) => entry.month < currentMonth)
      .reduce((sum, entry) => sum + entry.count, 0);

    monthlyGoal = Math.max(0, cumulativeExpected - previousMonthsRead);
  }

  return {
    volumesRead: volumesRead.map((entry) => ({
      id: entry.id,
      volumeId: entry.volume_id,
      lastReadAt: entry.last_read_at,
    })),
    readEntries: readEntries.map((entry) => ({
      lastReadAt: entry.last_read_at,
    })),
    allCompleted: allCompleted.map((entry) => ({
      id: entry.id,
      volumeId: entry.volume_id,
    })),
    allReadDates: allReadDates.map((entry) => ({
      lastReadAt: entry.last_read_at,
    })),
    dailyReading,
    totalVolumes: Number(totalVolumes?.count ?? 0),
    totalSeries: Number(totalSeries?.count ?? 0),
    readingProgressSummary: {
      totalTracked,
      totalRead,
      totalUnread,
    },
    monthlyReads,
    monthlyGoal,
  };
}
