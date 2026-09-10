"use client";

import { useState } from "react";
import { HeartIcon, HeartOffIcon } from "lucide-react";
import clsx from "clsx";
import StatusSelect from "./StatusSelect";
import { toggleSeriesFavorite } from "@/actions/favorites";
import OfflineDownloadButton from "@/components/pwa/OfflineDownloadButton";
import { enqueueOfflineOperation } from "@/lib/client/offlineLibrary";
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
  const [isFavorite, setIsFavorite] = useState(initFavorite);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFavorite = async () => {
    setIsLoading(true);

    try {
      if (!navigator.onLine && userId) {
        const favorite = !isFavorite;
        await enqueueOfflineOperation(userId, "series-favorite", { seriesId, favorite });
        setIsFavorite(favorite);
        return;
      }
      const result = await toggleSeriesFavorite({
        seriesId,
        favorite: !isFavorite,
      });

      if (!result) return;

      if (result.success) {
        setIsFavorite((prev) => !prev);
      } else if ("error" in result) {
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
      <button
        onClick={toggleFavorite}
        disabled={isLoading}
        className={clsx(
          "p-3 2xl:p-4 rounded-lg leading-none border transition-all duration-300 cursor-pointer",
          isFavorite
            ? "text-onix bg-sand border-sand hover:bg-pearl hover:border-pearl"
            : "text-sand bg-blackamber border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl"
        )}
        title={isFavorite ? "Eliminar de favoritos" : "Marcar como favorito"}
      >
        {isFavorite ? <HeartOffIcon size={20} /> : <HeartIcon size={20} />}
      </button>
      <OfflineDownloadButton userId={userId} section={section} slug={seriesSlug} seriesId={seriesId} intl={intl} />
    </div>
  );
}
