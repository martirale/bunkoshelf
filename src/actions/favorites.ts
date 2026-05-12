"use server";

import { verifySession } from "@/lib/auth/verifySession";
import {
  upsertSeriesFavorite,
  upsertVolumeProgress,
} from "@/lib/db/reading";

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

    await upsertSeriesFavorite(user.id, normalizedSeriesId, normalizedFavorite);

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

    await upsertVolumeProgress(user.id, normalizedVolumeId, {
      isFavorite: normalizedFavorite,
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
