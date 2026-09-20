"use client";

import { useState } from "react";
import { HeartIcon, HeartOffIcon } from "lucide-react";
import { toggleBookSeriesFavorite } from "@/actions/books-favorites";
import Button from "@/components/ui/Button";
import { useResourceMutation, useResourceState } from "@/lib/client/resourceState";
import type { Dictionary } from "@/lib/types";

interface BookSeriesFavoriteButtonProps {
  seriesId: string;
  initialFavorite: boolean;
  intl: Dictionary;
}

export default function BookSeriesFavoriteButton({ seriesId, initialFavorite, intl }: BookSeriesFavoriteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const books = intl.books as Record<string, string>;
  const { isFavorite = initialFavorite } = useResourceState(
    "book-series",
    seriesId,
    { isFavorite: initialFavorite },
  );
  const mutateResource = useResourceMutation();

  const toggleFavorite = async () => {
    setIsLoading(true);
    try {
      const result = await mutateResource({
        resource: "book-series",
        id: seriesId,
        patch: { isFavorite: !isFavorite },
        mutate: () => toggleBookSeriesFavorite({ seriesId, favorite: !isFavorite }),
        isSuccess: (value) => value.success,
      });
      if (result.success) {
      }
    } finally {
      setIsLoading(false);
    }
  };

  const label = isFavorite ? books.removeFavorite : books.addFavorite;

  return (
    <Button
      onClick={toggleFavorite}
      disabled={isLoading}
      title={label}
      aria-label={label}
      variant={isFavorite ? "lightAlt" : "dark"}
      size="actionIcon"
    >
      {isFavorite ? <HeartOffIcon size={20} /> : <HeartIcon size={20} />}
    </Button>
  );
}
