"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon, HeartOffIcon } from "lucide-react";
import { toggleBookSeriesFavorite } from "@/actions/books-favorites";
import Button from "@/components/ui/Button";
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
    <Button
      onClick={toggleFavorite}
      disabled={isLoading}
      title={label}
      aria-label={label}
      variant={isFavorite ? "lightAlt" : "dark"}
      size="icon"
      className="size-11 2xl:size-13"
    >
      {isFavorite ? <HeartOffIcon size={20} /> : <HeartIcon size={20} />}
    </Button>
  );
}
