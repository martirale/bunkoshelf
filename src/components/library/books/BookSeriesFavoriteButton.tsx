"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { HeartIcon, HeartOffIcon } from "lucide-react";
import { toggleBookSeriesFavorite } from "@/actions/books-favorites";
import type { Dictionary } from "@/lib/types";

interface BookSeriesFavoriteButtonProps {
  seriesId: string;
  initialFavorite: boolean;
  intl: Dictionary;
}

export default function BookSeriesFavoriteButton({ seriesId, initialFavorite, intl }: BookSeriesFavoriteButtonProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const books = intl.books as Record<string, string>;

  const toggleFavorite = async () => {
    setIsLoading(true);
    try {
      const result = await toggleBookSeriesFavorite({ seriesId, favorite: !isFavorite });
      if (result.success) {
        setIsFavorite((current) => !current);
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const label = isFavorite ? books.removeFavorite : books.addFavorite;

  return (
    <div className="mt-4 flex flex-row gap-2">
      <button
        onClick={toggleFavorite}
        disabled={isLoading}
        title={label}
        aria-label={label}
        className={clsx(
          "cursor-pointer rounded-lg border p-3 leading-none transition-all duration-300 2xl:p-4",
          isFavorite ? "border-sand bg-sand text-onix hover:border-pearl hover:bg-pearl" : "border-blackamber bg-blackamber text-sand hover:border-pearl hover:bg-pearl hover:text-onix",
        )}
      >
        {isFavorite ? <HeartOffIcon size={20} /> : <HeartIcon size={20} />}
      </button>
    </div>
  );
}
