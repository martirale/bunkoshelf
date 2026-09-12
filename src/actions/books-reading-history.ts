"use server";

import { verifySession } from "@/lib/auth/verifySession";
import {
  createBookReadingEntryRecord,
  deleteBookReadingEntryRecord,
  findBookProgress,
  findBookReadingEntryById,
  findOldestBookReadingEntryDate,
  updateBookReadingEntryRecord,
  upsertBookProgress,
} from "@/lib/db/books/reading";
import { ensureDailyReadingLog } from "@/lib/db/reading";

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function syncBookReadState(userId: string, volumeId: string) {
  const oldestEntry = await findOldestBookReadingEntryDate(userId, volumeId);
  const progress = await findBookProgress(userId, volumeId);

  await upsertBookProgress(userId, volumeId, {
    isRead: Boolean(oldestEntry),
    progression: oldestEntry ? 1 : 0,
    lastReadAt: oldestEntry ? progress?.lastReadAt ?? null : null,
    skipReadingEntry: true,
  });
}

export async function createBookReadingEntry({ volumeId, readAt }: { volumeId: string; readAt: string }) {
  const user = await verifySession();
  if (!user) return { success: false as const, error: "Unauthorized" };
  if (!volumeId || !isDate(readAt)) return { success: false as const, error: "Invalid payload" };

  const entry = await createBookReadingEntryRecord(user.id, volumeId, readAt);
  await ensureDailyReadingLog(user.id, readAt);
  await syncBookReadState(user.id, volumeId);

  return { success: true as const, entry };
}

export async function updateBookReadingEntry({ entryId, readAt }: { entryId: string; readAt: string }) {
  const user = await verifySession();
  if (!user) return { success: false as const, error: "Unauthorized" };
  if (!entryId || !isDate(readAt)) return { success: false as const, error: "Invalid payload" };

  const existing = await findBookReadingEntryById(entryId);
  if (!existing || existing.userId !== user.id) return { success: false as const, error: "Not found" };

  const entry = await updateBookReadingEntryRecord(entryId, readAt);
  await ensureDailyReadingLog(user.id, readAt);
  await syncBookReadState(user.id, existing.volumeId);

  return { success: true as const, entry };
}

export async function deleteBookReadingEntry({ entryId }: { entryId: string }) {
  const user = await verifySession();
  if (!user) return { success: false as const, error: "Unauthorized" };
  if (!entryId) return { success: false as const, error: "Invalid payload" };

  const existing = await findBookReadingEntryById(entryId);
  if (!existing || existing.userId !== user.id) return { success: false as const, error: "Not found" };

  await deleteBookReadingEntryRecord(entryId);
  await syncBookReadState(user.id, existing.volumeId);

  return { success: true as const };
}
