"use server";

import { verifySession } from "@/lib/auth/verifySession";
import { findBookVolumeBySlug } from "@/lib/db/books/library";
import { upsertBookProgress } from "@/lib/db/books/reading";

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function updateBookReadState({ slug, read, readAt }: { slug: string; read: boolean; readAt?: string }) {
  const user = await verifySession();
  if (!user) return { success: false as const, error: "Unauthorized" };
  if (!slug || (read && (!readAt || !isDate(readAt)))) {
    return { success: false as const, error: "Invalid payload" };
  }

  const volume = await findBookVolumeBySlug(slug);
  if (!volume) return { success: false as const, error: "Book not found" };

  await upsertBookProgress(user.id, volume.id, {
    isRead: read,
    progression: read ? 1 : 0,
    lastReadAt: read ? new Date() : null,
    readingDate: readAt,
  });

  return { success: true as const };
}
