import { query } from "@/lib/db/query";
import type { UserVolumeProgress } from "@/lib/db/library";

export async function getSeriesBulkProgress(
  userId: string | null,
  seriesIds: string[]
): Promise<Record<string, number>> {
  if (!userId || !seriesIds?.length) return {};

  const records = await query<{ series_id: string; read_count: string }>(
    `
      SELECT mv.series_id, COUNT(*)::text AS read_count
      FROM user_to_volumes utv
      INNER JOIN manga_volumes mv ON mv.id = utv.volume_id
      WHERE utv.user_id = $1
        AND utv.is_read = TRUE
        AND mv.series_id = ANY($2::text[])
      GROUP BY mv.series_id
    `,
    [userId, seriesIds]
  );

  return records.reduce<Record<string, number>>((acc, record) => {
    acc[record.series_id] = Number(record.read_count);
    return acc;
  }, {});
}

export function getVolumeProgressRatio(
  progress: Pick<UserVolumeProgress, "isRead" | "lastPage" | "totalPages"> | null | undefined
): number {
  if (!progress) {
    return 0;
  }

  if (progress.isRead) {
    return 1;
  }

  if (!progress.totalPages || progress.totalPages <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, ((progress.lastPage ?? 0) + 1) / progress.totalPages));
}
