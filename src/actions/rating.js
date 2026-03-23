"use server";

import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function updatePersonalRating({ volumeId, rating }) {
  let error;
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

    await prisma.userToVolume.upsert({
      where: {
        userId_volumeId: {
          userId: user.id,
          volumeId: normalizedVolumeId,
        },
      },
      update: {
        personalRating: normalizedRating,
      },
      create: {
        userId: user.id,
        volumeId: normalizedVolumeId,
        personalRating: normalizedRating,
      },
    });

    return { success: true, status: 200 };
  } catch (e) {
    error = e;
  } finally {
    if (error) {
      console.error("Error updating personal rating:", error);
      return { error: "Server error", status: 500 };
    }
  }
}
