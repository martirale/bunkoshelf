"use server";

import { verifySession } from "@/lib/auth/verifySession";
import { findBookSeriesById } from "@/lib/db/books/library";
import { upsertBookSeriesFavorite } from "@/lib/db/books/reading";

export async function toggleBookSeriesFavorite({ seriesId, favorite }: { seriesId: string; favorite: boolean }) {
  const user = await verifySession();
  if (!user) return { success: false as const, error: "Unauthorized" };

  const series = await findBookSeriesById(seriesId);
  if (!series) return { success: false as const, error: "Series not found" };

  await upsertBookSeriesFavorite(user.id, seriesId, favorite);
  return { success: true as const };
}
