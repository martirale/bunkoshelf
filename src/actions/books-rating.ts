"use server";

import { verifySession } from "@/lib/auth/verifySession";
import { upsertBookProgress } from "@/lib/db/books/reading";

interface UpdateBookRatingParams {
  volumeId: string | null | undefined;
  rating: number | null;
}

export async function updateBookRating({ volumeId, rating }: UpdateBookRatingParams) {
  const user = await verifySession();
  if (!user) return { error: "Unauthorized", status: 401 };
  if (!volumeId) return { error: "Invalid payload", status: 400 };

  const normalizedRating = rating === null ? null : Math.round(Number(rating) * 2) / 2;
  if (normalizedRating !== null && (
    Number.isNaN(normalizedRating) || normalizedRating < 0 || normalizedRating > 10
  )) {
    return { error: "Invalid rating", status: 400 };
  }

  await upsertBookProgress(user.id, volumeId, { personalRating: normalizedRating });
  return { success: true, status: 200 };
}
