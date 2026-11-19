"use client";

import { useCallback } from "react";
import { usePwa } from "@/components/pwa/PwaProvider";
import { saveOfflineRating } from "./offlineLibrary";
import { useResourceMutation } from "./resourceState";

type RatingResource = "manga-volume" | "book-volume";

export function useOfflineRating(resource: RatingResource, volumeId: string) {
  const { online, userId } = usePwa();
  const mutateResource = useResourceMutation();

  return useCallback(async (
    rating: number | null,
    updateOnServer: () => Promise<{ success?: boolean } | undefined>,
  ) => {
    const local = !online && userId;
    try {
      await mutateResource({
        resource,
        id: volumeId,
        patch: { personalRating: rating },
        refresh: online,
        mutate: async () => {
          if (local) return { success: await saveOfflineRating(local, volumeId, rating, true) };
          const result = await updateOnServer();
          if (result?.success && userId) {
            await saveOfflineRating(userId, volumeId, rating, false).catch(() => undefined);
          }
          return result;
        },
        isSuccess: (result) => result?.success === true,
      });
    } catch (error) {
      console.error("Error saving rating:", error);
    }
  }, [mutateResource, online, resource, userId, volumeId]);
}
