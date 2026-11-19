"use server";

import { verifySession } from "@/lib/auth/verifySession";
import { saveVolumeReadingPosition } from "@/lib/db/reading";
import { findVolumeBySlug } from "@/lib/db/library";
import { canAccessLibraryVolume } from "@/lib/clubs/access";
import { recordClubProgressActivities } from "@/lib/db/clubs";

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

    const readAt = new Date(lastReadAt);
    if (!volumeSlug || !Number.isSafeInteger(lastPage) || !Number.isSafeInteger(totalPages)
      || lastPage < 0 || lastPage >= totalPages || !Number.isFinite(readAt.getTime())
      || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { error: "Invalid progress", status: 400 };
    }

    const volume = await findVolumeBySlug({
      slug: volumeSlug,
    });

    if (!volume) {
      return { error: "Volume not found", status: 404 };
    }
    if (!(await canAccessLibraryVolume(user, volume.id))) return { error: "Forbidden", status: 403 };

    const result = await saveVolumeReadingPosition(user.id, volume.id, {
      lastPage, totalPages, lastReadAt: readAt, date,
    });
    await recordClubProgressActivities(user.id, "LIBRARY_SERIES", volume.seriesId);
    return { success: true, ...result };
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error updating reading progress:", error);
      return { error: "Server error", status: 500 };
    }
  }
}
