"use client";

import { useState } from "react";
import Link from "next/link";
import { BookCheck, EyeClosed, Check, Heart, HeartOff } from "lucide-react";
import ReaderModal from "@/components/reader/ReaderModal";

export default function ReadButtonsVolume({
  lang,
  intl,
  volumeId,
  slug,
  initFavorite,
}) {
  const [isFavorite, setIsFavorite] = useState(initFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  const toggleFavorite = async () => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/library/manga/favorites/volumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volumeId,
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
    <>
      <div className="flex flex-row mt-4 gap-2">
        <button
          onClick={() => setIsReaderOpen(true)}
          className="flex items-center font-bold px-6 py-4 rounded-lg leading-none uppercase text-sand bg-lilah border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl cursor-pointer transition-all duration-300"
        >
          <BookCheck className="w-5 h-5 mr-2" />
          {intl.manga.read}
        </button>

        <Link
          href="#"
          className="flex items-center font-bold p-4 rounded-lg leading-none uppercase text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl transition-all duration-300"
          title="Leer de incógnito"
        >
          <EyeClosed className="w-5 h-5" />
        </Link>

        <button
          className="p-4 rounded-lg leading-none text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl transition-all duration-300 cursor-pointer"
          title="Marcar como leído"
        >
          <Check className="w-5 h-5" />
        </button>

        <button
          onClick={toggleFavorite}
          disabled={isLoading}
          className={`p-4 rounded-lg leading-none border transition-all duration-300 cursor-pointer ${
            isFavorite
              ? "text-onix bg-sand border-sand hover:bg-pearl hover:border-pearl"
              : "text-sand bg-blackamber border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl"
          }`}
          title={isFavorite ? "Eliminar de favoritos" : "Marcar como favorito"}
        >
          {isFavorite ? (
            <HeartOff className="w-5 h-5" />
          ) : (
            <Heart className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Modal del lector */}
      <ReaderModal
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
        slug={slug}
      />
    </>
  );
}
