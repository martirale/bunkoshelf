"use client";

import { useState } from "react";
import { HeartIcon, HeartOffIcon } from "lucide-react";
import StatusSelect from "./StatusSelect";
import { toggleSeriesFavorite } from "@/actions/favorites";
import OfflineDownloadButton from "@/components/pwa/OfflineDownloadButton";
import Button from "@/components/ui/Button";
import { enqueueOfflineOperation } from "@/lib/client/offlineLibrary";
import {
  publishResourceState,
  useResourceMutation,
  useResourceState,
} from "@/lib/client/resourceState";
import type { LibrarySection } from "@/lib/librarySection";
import type { Locale, Dictionary } from "@/lib/types";

interface ReadButtonsSeriesProps {
  lang: Locale;
  intl: Dictionary;
  seriesId: string;
  initFavorite: boolean;
  seriesSlug: string;
  section?: LibrarySection;
  userId?: string;
}

export default function ReadButtonsSeries({
  lang,
  intl,
  seriesId,
  initFavorite,
  seriesSlug,
  section = "manga",
  userId,
}: ReadButtonsSeriesProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { isFavorite = initFavorite } = useResourceState(
    "manga-series",
    seriesId,
    { isFavorite: initFavorite },
  );
  const mutateResource = useResourceMutation();

  const toggleFavorite = async () => {
    setIsLoading(true);

    try {
      if (!navigator.onLine && userId) {
        const favorite = !isFavorite;
        await enqueueOfflineOperation(userId, "series-favorite", { seriesId, favorite });
        publishResourceState("manga-series", seriesId, { isFavorite: favorite });
        return;
      }
      const result = await mutateResource({
        resource: "manga-series",
        id: seriesId,
        patch: { isFavorite: !isFavorite },
        mutate: () => toggleSeriesFavorite({ seriesId, favorite: !isFavorite }),
        isSuccess: (value) => Boolean(value?.success),
      });

      if (!result) return;

      if (!result.success && "error" in result) {
        console.error("Failed to toggle favorite:", result.error);
      }
    } catch (err) {
      console.error("Request error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-row mt-4 gap-2">
      <StatusSelect lang={lang} intl={intl} seriesId={seriesId} />
      <Button
        onClick={toggleFavorite}
        disabled={isLoading}
        variant={isFavorite ? "lightAlt" : "dark"}
        size="icon"
        className="size-11 2xl:size-13"
        title={isFavorite ? "Eliminar de favoritos" : "Marcar como favorito"}
      >
        {isFavorite ? <HeartOffIcon size={20} /> : <HeartIcon size={20} />}
      </Button>
      <OfflineDownloadButton userId={userId} section={section} slug={seriesSlug} seriesId={seriesId} intl={intl} />
    </div>
  );
}
