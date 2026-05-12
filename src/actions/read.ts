"use server";

import { verifySession } from "@/lib/auth/verifySession";
import {
  createReadingEntryRecord,
  upsertVolumeProgress,
} from "@/lib/db/reading";
import { syncFirstRead } from "@/actions/readingHistory";

interface UpdateReadStateParams {
  volumeId: string;
  read: boolean | string;
  totalPages?: number | null;
  lastReadAt?: string | null;
  firstRead?: string;
}

export async function updateReadState({
  volumeId,
  read,
  totalPages,
  lastReadAt,
  firstRead,
}: UpdateReadStateParams) {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    const normalizedVolumeId =
      typeof volumeId === "string"
        ? volumeId
        : volumeId == null
        ? ""
        : String(volumeId);
    const normalizedRead = read === true || String(read) === "true";
    const normalizedTotalPages =
      totalPages !== undefined && totalPages !== null
        ? Number(totalPages)
        : undefined;

    if (
      typeof normalizedVolumeId !== "string" ||
      !normalizedVolumeId ||
      typeof normalizedRead !== "boolean" ||
      (normalizedRead && !Number.isInteger(normalizedTotalPages))
    ) {
      return { error: "Invalid payload", status: 400 };
    }

    const updatePayload = {
      isRead: normalizedRead,
      lastPage: normalizedRead ? normalizedTotalPages! - 1 : 0,
      totalPages: normalizedTotalPages,
      lastReadAt: normalizedRead ? new Date(lastReadAt || Date.now()) : null,
    };

    await upsertVolumeProgress(user.id, normalizedVolumeId, {
      isRead: updatePayload.isRead,
      lastPage: updatePayload.lastPage,
      totalPages: updatePayload.totalPages,
      lastReadAt: updatePayload.lastReadAt,
    });

    if (normalizedRead && typeof firstRead === "string") {
      await createReadingEntryRecord(user.id, normalizedVolumeId, firstRead);

      await syncFirstRead(user.id, normalizedVolumeId);
    }

    return { success: true, status: 200 };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error updating read state:", error);
      return { error: "Server error", status: 500 };
    }
  }
}
