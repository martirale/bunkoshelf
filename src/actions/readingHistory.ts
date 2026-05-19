"use server";

import { verifySession } from "@/lib/auth/verifySession";
import {
  createReadingEntryRecord,
  deleteReadingEntryRecord,
  ensureDailyReadingLog,
  findOldestReadingEntryDate,
  findReadingEntryById,
  findVolumeProgress,
  listReadingEntries,
  updateReadingEntryRecord,
  upsertVolumeProgress,
} from "@/lib/db/reading";
import { findVolumePageCountById } from "@/lib/db/library";

export async function syncFirstRead(userId: string, volumeId: string) {
  const oldest = await findOldestReadingEntryDate(userId, volumeId);
  const hasEntries = !!oldest;

  let progressUpdate: { lastPage?: number; totalPages?: number } = {};

  if (hasEntries) {
    const existing = await findVolumeProgress(userId, volumeId);

    let totalPages = existing?.total_pages ?? undefined;

    if (!totalPages) {
      totalPages = (await findVolumePageCountById(volumeId)) ?? undefined;
    }

    if (totalPages) {
      progressUpdate = { lastPage: totalPages - 1, totalPages };
    }
  } else {
    progressUpdate = { lastPage: 0 };
  }

  await upsertVolumeProgress(userId, volumeId, {
    firstRead: oldest ?? null,
    isRead: hasEntries,
    ...progressUpdate,
  });
}

export async function getReadingHistory({ volumeId }: { volumeId: string }) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const entries = await listReadingEntries(user.id, volumeId);

  return { entries };
}

export async function createReadingEntry({ volumeId, readAt }: { volumeId: string; readAt: string }) {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!volumeId || !readAt) {
      return { error: "Missing fields", status: 400 };
    }

    const entry = await createReadingEntryRecord(user.id, volumeId, readAt);
    await ensureDailyReadingLog(user.id, readAt);

    await syncFirstRead(user.id, volumeId);

    return { success: true, entry };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error creating reading entry:", error);
      return { error: "Server error", status: 500 };
    }
  }
}

export async function updateReadingEntry({ entryId, readAt }: { entryId: string; readAt: string }) {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!entryId || !readAt) {
      return { error: "Missing fields", status: 400 };
    }

    const existing = await findReadingEntryById(entryId);

    if (!existing || existing.user_id !== user.id) {
      return { error: "Not found", status: 404 };
    }

    const entry = await updateReadingEntryRecord(entryId, readAt);
    await ensureDailyReadingLog(user.id, readAt);

    await syncFirstRead(user.id, existing.volume_id);

    return { success: true, entry };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error updating reading entry:", error);
      return { error: "Server error", status: 500 };
    }
  }
}

export async function deleteReadingEntry({ entryId }: { entryId: string }) {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!entryId) {
      return { error: "Missing fields", status: 400 };
    }

    const existing = await findReadingEntryById(entryId);

    if (!existing || existing.user_id !== user.id) {
      return { error: "Not found", status: 404 };
    }

    await deleteReadingEntryRecord(entryId);

    await syncFirstRead(user.id, existing.volume_id);

    return { success: true };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error deleting reading entry:", error);
      return { error: "Server error", status: 500 };
    }
  }
}
