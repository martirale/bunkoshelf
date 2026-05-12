import { query } from "@/lib/db/query";

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
