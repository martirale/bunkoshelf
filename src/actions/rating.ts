"use server";

import { verifySession } from "@/lib/auth/verifySession";
import { upsertVolumeProgress } from "@/lib/db/reading";

interface UpdatePersonalRatingParams {
  volumeId: string | number | null | undefined;
  rating: number | null;
}

export async function updatePersonalRating({ volumeId, rating }: UpdatePersonalRatingParams) {
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

    if (!normalizedVolumeId) {
      return { error: "Invalid payload", status: 400 };
    }

    const normalizedRating =
      rating === null ? null : Math.round(Number(rating) * 2) / 2;

    if (
      normalizedRating !== null &&
      (normalizedRating < 0 || normalizedRating > 10 || isNaN(normalizedRating))
    ) {
      return { error: "Invalid rating", status: 400 };
    }

    await upsertVolumeProgress(user.id, normalizedVolumeId, {
      personalRating: normalizedRating,
    });

    return { success: true, status: 200 };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error updating personal rating:", error);
      return { error: "Server error", status: 500 };
    }
  }
}
