"use client";

import { useState } from "react";
import { BookCheck, Ghost, Check, Heart, HeartOff } from "lucide-react";
import ReaderModal from "@/components/reader/ReaderModal";

export default function ReadButtonsVolume({
  lang,
  intl,
  volumeId,
  slug,
  initFavorite,
  initRead,
}) {
  const [isFavorite, setIsFavorite] = useState(initFavorite);
  const [isRead, setIsRead] = useState(initRead);
  const [isLoading, setIsLoading] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isYoureiMode, setIsYoureiMode] = useState(false);

  const openNormalReader = () => {
    setIsYoureiMode(false);
    setIsReaderOpen(true);
  };

  const openYoureiReader = () => {
    setIsYoureiMode(true);
    setIsReaderOpen(true);
  };

  const toggleRead = async () => {
    setIsLoading(true);
    try {
      const imagesRes = await fetch("/api/reader/manga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const imagesData = await imagesRes.json();
      if (!imagesRes.ok || !imagesData.images?.length) {
        console.error("No se pudieron obtener las páginas del volumen");
        return;
      }

      const totalPages = imagesData.images.length;

      const res = await fetch("/api/library/manga/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volumeId,
          read: !isRead,
          totalPages,
          lastReadAt: !isRead ? new Date().toISOString() : null,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setIsRead((prev) => !prev);
      } else {
        console.error("Failed to toggle read state:", result.error);
      }
    } catch (err) {
      console.error("Request error:", err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleClose = async () => {
    try {
      const storageKey = `reader-progress:${slug}`;
      const saved = localStorage.getItem(storageKey);

      if (saved && !isYoureiMode) {
        const { lastPage, totalPages, lastReadAt } = JSON.parse(saved);
        const res = await fetch("/api/reader/progress/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            volumeSlug: slug,
            lastPage,
            totalPages,
            lastReadAt,
          }),
        });

        const data = await res.json();
        if (!data.success) {
          console.error("Sync failed:", data.error);
        }
      }
    } catch (err) {
      console.error("Error syncing progress:", err);
    }

    setIsReaderOpen(false);
  };

  return (
    <>
      <div className="flex flex-row mt-4 gap-2">
        {/* Botón lector normal */}
        <button
          onClick={openNormalReader}
          className="flex items-center font-bold px-5 py-2 2xl:px-6 2xl:py-4 rounded-lg leading-none uppercase text-sand bg-lilah border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl cursor-pointer transition-all duration-300"
        >
          <BookCheck className="w-5 h-5 mr-2" />
          {intl.manga.read}
        </button>

        {/* Botón lector incógnito */}
        <button
          onClick={openYoureiReader}
          title="Leer de incógnito"
          className="p-3 2xl:p-4 rounded-lg leading-none uppercase text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl cursor-pointer transition-all duration-300"
        >
          <Ghost className="w-5 h-5" />
        </button>

        {/* Botón marcar como leído */}
        <button
          onClick={toggleRead}
          disabled={isLoading}
          title={isRead ? "Marcar como no leído" : "Marcar como leído"}
          className={`p-3 2xl:p-4 rounded-lg leading-none border transition-all duration-300 cursor-pointer ${
            isRead
              ? "text-onix bg-sand border-sand hover:bg-pearl hover:border-pearl"
              : "text-sand bg-blackamber border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl"
          }`}
        >
          <Check className="w-5 h-5" />
        </button>

        {/* Botón favoritos */}
        <button
          onClick={toggleFavorite}
          disabled={isLoading}
          title={isFavorite ? "Eliminar de favoritos" : "Marcar como favorito"}
          className={`p-3 2xl:p-4 rounded-lg leading-none border transition-all duration-300 cursor-pointer ${
            isFavorite
              ? "text-onix bg-sand border-sand hover:bg-pearl hover:border-pearl"
              : "text-sand bg-blackamber border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl"
          }`}
        >
          {isFavorite ? (
            <HeartOff className="w-5 h-5" />
          ) : (
            <Heart className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Modal lector */}
      <ReaderModal
        isOpen={isReaderOpen}
        onClose={handleClose}
        slug={slug}
        lang={lang}
        intl={intl}
        isYoureiMode={isYoureiMode}
      />
    </>
  );
}
