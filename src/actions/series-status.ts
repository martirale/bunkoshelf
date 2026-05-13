"use server";

import { verifySession } from "@/lib/auth/verifySession";
import { queryOne } from "@/lib/db/query";

interface UpdateSeriesStatusParams {
  seriesId: string | number | null | undefined;
  status: string;
}

interface GetSeriesStatusParams {
  seriesId: string | number | null | undefined;
}

const ALLOWED = new Set(["ONGOING", "FINISHED", "HIATUS", "CANCELLED"]);

export async function updateSeriesStatus({ seriesId, status }: UpdateSeriesStatusParams) {
  let _err: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!seriesId) {
      return { error: "seriesId requerido", status: 400 };
    }

    if (!status || !ALLOWED.has(status)) {
      return { error: "status inválido", status: 400 };
    }

    const updated = await queryOne<{ status: string }>(
      `
        UPDATE manga_series
        SET status = $2,
            updated_at = NOW()
        WHERE id = $1
        RETURNING status
      `,
      [String(seriesId), status]
    );

    if (!updated) {
      return { error: "no encontrado", status: 404 };
    }

    return { status: updated.status, statusCode: 200 };
  } catch (err) {
    _err = err as Error;
  } finally {
    if (_err) {
      console.error("Error updating series status:", _err);
      return { error: "Server error", status: 500 };
    }
  }
}

export async function getSeriesStatus({ seriesId }: GetSeriesStatusParams) {
  let _err: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!seriesId) {
      return { error: "seriesId requerido", status: 400 };
    }

    const record = await queryOne<{ status: string | null }>(
      `
        SELECT status
        FROM manga_series
        WHERE id = $1
        LIMIT 1
      `,
      [String(seriesId)]
    );

    if (!record) {
      return { error: "no encontrado", status: 404 };
    }

    return { status: record.status || "FINISHED" };
  } catch (err) {
    _err = err as Error;
  } finally {
    if (_err) {
      console.error("Error fetching series status:", _err);
      return { error: "Server error", status: 500 };
    }
  }
}
