"use server";

import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

const ALLOWED = new Set(["ONGOING", "FINISHED", "HIATUS", "CANCELLED"]);

export async function updateSeriesStatus({ seriesId, status }) {
  let _err;
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

    const updated = await prisma.mangaSeries.update({
      where: { id: String(seriesId) },
      data: { status },
    });

    return { status: updated.status, statusCode: 200 };
  } catch (err) {
    _err = err;
  } finally {
    if (_err) {
      console.error("Error updating series status:", _err);
      return { error: "Server error", status: 500 };
    }
  }
}

export async function getSeriesStatus({ seriesId }) {
  let _err;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!seriesId) {
      return { error: "seriesId requerido", status: 400 };
    }

    const record = await prisma.mangaSeries.findUnique({
      where: { id: String(seriesId) },
      select: { status: true },
    });

    if (!record) {
      return { error: "no encontrado", status: 404 };
    }

    return { status: record.status || "FINISHED" };
  } catch (err) {
    _err = err;
  } finally {
    if (_err) {
      console.error("Error fetching series status:", _err);
      return { error: "Server error", status: 500 };
    }
  }
}
