"use server";

import { verifySession } from "@/lib/auth/verifySession";
import { syncFirstRead } from "@/actions/readingHistory";
import {
  createReadingEntryRecord,
  ensureDailyReadingLog,
  incrementChallengeCompleted,
  upsertVolumeProgress,
} from "@/lib/db/reading";
import { findVolumeBySlug } from "@/lib/db/library";

interface SyncProgressParams {
  volumeSlug: string;
  lastPage: number;
  totalPages: number;
  lastReadAt: string;
  date: string;
}

export async function syncReadingProgress({
  volumeSlug,
  lastPage,
  totalPages,
  lastReadAt,
  date,
}: SyncProgressParams) {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!volumeSlug || lastPage == null || totalPages == null || !lastReadAt) {
      return { error: "Missing fields", status: 400 };
    }

    const volume = await findVolumeBySlug({
      slug: volumeSlug,
    });

    if (!volume) {
      return { error: "Volume not found", status: 404 };
    }

    const userId = user.id;
    const volumeId = volume.id;

    const isNowRead = lastPage >= totalPages - 1;

    await upsertVolumeProgress(userId, volumeId, {
      lastPage,
      totalPages,
      lastReadAt: new Date(lastReadAt),
      isRead: isNowRead,
    });

    if (isNowRead) {
      await createReadingEntryRecord(userId, volumeId, date);

      await syncFirstRead(userId, volumeId);

      const currentYear = new Date().getFullYear();
      await incrementChallengeCompleted(user.id, currentYear);
    }

    await ensureDailyReadingLog(userId, date);

    return { success: true };
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error updating reading progress:", error);
      return { error: "Server error", status: 500 };
    }
  }
}
