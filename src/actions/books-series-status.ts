"use server";

import { verifySession } from "@/lib/auth/verifySession";
import { queryOne } from "@/lib/db/query";

interface SeriesStatusParams {
  seriesId: string | null | undefined;
}

interface UpdateBookSeriesStatusParams extends SeriesStatusParams {
  status: string;
}

const ALLOWED_STATUSES = new Set(["ONGOING", "FINISHED", "HIATUS", "CANCELLED"]);

export async function getBookSeriesStatus({ seriesId }: SeriesStatusParams) {
  const user = await verifySession();
  if (!user) return { error: "Unauthorized", status: 401 };
  if (!seriesId) return { error: "Invalid series", status: 400 };

  const series = await queryOne<{ status: string | null }>(
    "SELECT status FROM book_series WHERE id = $1 LIMIT 1",
    [seriesId],
  );
  if (!series) return { error: "Not found", status: 404 };

  return { status: series.status ?? "FINISHED" };
}

export async function updateBookSeriesStatus({ seriesId, status }: UpdateBookSeriesStatusParams) {
  const user = await verifySession();
  if (!user) return { error: "Unauthorized", status: 401 };
  if (!seriesId || !ALLOWED_STATUSES.has(status)) {
    return { error: "Invalid payload", status: 400 };
  }

  const series = await queryOne<{ status: string }>(
    `UPDATE book_series
     SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING status`,
    [seriesId, status],
  );
  if (!series) return { error: "Not found", status: 404 };

  return { status: series.status, statusCode: 200 };
}
