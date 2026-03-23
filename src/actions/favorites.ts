"use server";

import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

interface ToggleSeriesFavoriteParams {
  seriesId: string | number | null | undefined;
  favorite: boolean | string;
}

interface ToggleVolumeFavoriteParams {
  volumeId: string | number | null | undefined;
  favorite: boolean | string;
}

export async function toggleSeriesFavorite({ seriesId, favorite }: ToggleSeriesFavoriteParams) {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    const normalizedSeriesId =
      typeof seriesId === "string"
        ? seriesId
        : seriesId == null
        ? ""
        : String(seriesId);
    const normalizedFavorite = favorite === true || String(favorite) === "true";

    if (
      typeof normalizedSeriesId !== "string" ||
      !normalizedSeriesId ||
      typeof normalizedFavorite !== "boolean"
    ) {
      return { error: "Invalid payload", status: 400 };
    }

    await prisma.userToSeries.upsert({
      where: {
        userId_seriesId: {
          userId: user.id,
          seriesId: normalizedSeriesId,
        },
      },
      update: {
        isFavorite: normalizedFavorite,
      },
      create: {
        userId: user.id,
        seriesId: normalizedSeriesId,
        isFavorite: normalizedFavorite,
      },
    });

    return { success: true, status: 200 };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error updating favorite (series):", error);
      return { error: "Server error", status: 500 };
    }
  }
}

export async function toggleVolumeFavorite({ volumeId, favorite }: ToggleVolumeFavoriteParams) {
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
    const normalizedFavorite = favorite === true || String(favorite) === "true";

    if (
      typeof normalizedVolumeId !== "string" ||
      !normalizedVolumeId ||
      typeof normalizedFavorite !== "boolean"
    ) {
      return { error: "Invalid payload", status: 400 };
    }

    await prisma.userToVolume.upsert({
      where: {
        userId_volumeId: {
          userId: user.id,
          volumeId: normalizedVolumeId,
        },
      },
      update: {
        isFavorite: normalizedFavorite,
      },
      create: {
        userId: user.id,
        volumeId: normalizedVolumeId,
        isFavorite: normalizedFavorite,
      },
    });

    return { success: true, status: 200 };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error updating favorite (volume):", error);
      return { error: "Server error", status: 500 };
    }
  }
}
