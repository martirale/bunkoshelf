"use client";

import { useState } from "react";
import { HeartIcon, HeartOffIcon } from "lucide-react";
import clsx from "clsx";
import StatusSelect from "./StatusSelect";

export default function ReadButtonsSeries({
  lang,
  intl,
  seriesId,
  initFavorite,
}) {
  const [isFavorite, setIsFavorite] = useState(initFavorite);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFavorite = async () => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/library/manga/favorites/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesId,
          favorite: !isFavorite,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setIsFavorite((prev) => !prev);
      } else {
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
    </div>
  );
}
