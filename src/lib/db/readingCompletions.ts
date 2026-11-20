import { cache } from "react";
import type { LibraryScope } from "@/lib/librarySection";
import { query } from "./query";

interface MonthlyCompletion {
  year: number;
  month: number;
  count: number;
}

const loadReadingCompletions = cache(async (userId: string, section: string | null, throughMonth: string) => {
  return query<MonthlyCompletion>(
    `
      WITH library_history AS (
        SELECT DISTINCT volume_id, read_at
        FROM reading_entries
        WHERE user_id = $1
      ), library_completions AS (
        SELECT volume_id, read_at FROM library_history
        UNION ALL
        SELECT progress.volume_id, progress.first_read
        FROM user_to_volumes progress
        WHERE progress.user_id = $1 AND progress.first_read IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM library_history WHERE volume_id = progress.volume_id)
      ), completions AS (
        SELECT reads.read_at
        FROM library_completions reads
        INNER JOIN library_volumes volume ON volume.id = reads.volume_id
        INNER JOIN library_series series ON series.id = volume.series_id
        WHERE ($2::text IS NULL OR series.library_section = $2)
        UNION ALL
        SELECT read_at
        FROM (
          SELECT DISTINCT volume_id, read_at
          FROM book_reading_entries
          WHERE user_id = $1 AND $2::text IS NULL
        ) books
      )
      SELECT LEFT(read_at, 4)::int AS year,
             SUBSTRING(read_at, 6, 2)::int AS month,
             COUNT(*)::int AS count
      FROM completions
      WHERE read_at ~ '^[0-9]{4}-(0[1-9]|1[0-2])-[0-9]{2}$'
        AND LEFT(read_at, 7) <= $3
      GROUP BY 1, 2
      ORDER BY 1, 2
    `,
    [userId, section, throughMonth],
  );
});

export function getReadingCompletions(userId: string, now: Date, scope: LibraryScope = "all") {
  const section = scope === "all" ? null : scope === "others" ? "other" : scope;
  const throughMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return loadReadingCompletions(userId, section, throughMonth);
}

export function countReadingCompletions(completions: MonthlyCompletion[], year: number) {
  return completions.reduce((total, entry) => total + (entry.year === year ? entry.count : 0), 0);
}
