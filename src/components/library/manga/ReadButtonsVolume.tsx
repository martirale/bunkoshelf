"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  BookCheckIcon,
  HatGlassesIcon,
  CheckIcon,
  HeartIcon,
  HeartOffIcon,
} from "lucide-react";
import MangaReader from "@/components/reader/MangaReader";
import { toggleVolumeFavorite } from "@/actions/favorites";
import { updateReadState } from "@/actions/read";
import { syncReadingProgress } from "@/actions/progress";
import { sendPush } from "@/actions/web-push";
import {
  getLibraryRootHref,
  type LibrarySection,
} from "@/lib/librarySection";
import type { Locale, Dictionary } from "@/lib/types";

interface ReadButtonsVolumeProps {
  lang: Locale;
  intl: Dictionary;
  volumeId: string;
  volumeTitle: string;
  coverSrc: string;
  slug: string;
  initFavorite: boolean;
  initRead: boolean;
  mangaStyle: string;
  communityRating: number | null;
  initialPersonalRating: number | null;
  section?: LibrarySection;
}

export default function ReadButtonsVolume({
  lang,
  intl,
  volumeId,
  volumeTitle,
  coverSrc,
  slug,
  initFavorite,
  initRead,
  mangaStyle,
  communityRating,
  initialPersonalRating,
  section = "manga",
}: ReadButtonsVolumeProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initFavorite);
  const [isRead, setIsRead] = useState(initRead);
  const [isLoading, setIsLoading] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isYoureiMode, setIsYoureiMode] = useState(false);

  const readingDirection =
    mangaStyle === "YesLTR" || mangaStyle === "No" ? "ltr" : "rtl";

  const openNormalReader = () => {
    setIsYoureiMode(false);
    setIsReaderOpen(true);
  };

  const openYoureiReader = () => {
    setIsYoureiMode(true);
    setIsReaderOpen(true);
  };

  const getLocalDateString = () => {
    const now = new Date();
    const localDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const toggleRead = async () => {
    let error: unknown = null;

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
      const now = new Date();
      const localDate = getLocalDateString();

      const result = await updateReadState({
        volumeId,
        read: !isRead,
        totalPages,
        lastReadAt: !isRead ? now.toISOString() : undefined,
        firstRead: !isRead ? localDate : undefined,
      });

      if (!result) return;

      if (result.success) {
        setIsRead((prev) => !prev);
      } else if ("error" in result) {
        console.error("Failed to toggle read state:", result.error);
      }
    } catch (err) {
      error = err;
    } finally {
      if (error) {
        console.error("Request error:", error);
      }
      setIsLoading(false);
    }
  };

  const toggleFavorite = async () => {
    let error: unknown = null;

    setIsLoading(true);
    try {
      const result = await toggleVolumeFavorite({
        volumeId,
        favorite: !isFavorite,
      });

      if (!result) return;

      if (result.success) {
        setIsFavorite((prev) => !prev);
      } else if ("error" in result) {
        console.error("Failed to toggle favorite:", result.error);
      }
    } catch (err) {
      error = err;
    } finally {
      if (error) {
        console.error("Request error:", error);
      }
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    let error: unknown = null;

    try {
      const storageKey = `reader-progress:${slug}`;
      const saved = localStorage.getItem(storageKey);

      if (saved && !isYoureiMode) {
        const { lastPage, totalPages, lastReadAt } = JSON.parse(saved);

        const isFinished = lastPage >= totalPages - 1;
        const today = getLocalDateString();

        const body = {
          volumeSlug: slug,
          lastPage,
          totalPages,
          lastReadAt,
          date: today,
        };

        const data = await syncReadingProgress(body);

        if (!data || !data.success) {
          console.error("Sync failed:", data && "error" in data ? data.error : "Unknown error");
        }

        if (isFinished && data?.success) {
          setIsRead(true);
        }

        if (isFinished && data?.success) {
          try {
            await sendPush({
              title: intl.push.ttFirstRead as string,
              body: (intl.push.bodyFirstRead as string).replace("{title}", volumeTitle),
              url: getLibraryRootHref(lang, section),
            });
          } catch (pushErr) {
            console.error("Error al enviar notificación push:", pushErr);
          }
        }
      }
    } catch (err) {
      error = err;
    } finally {
      if (error) {
        console.error("Error syncing progress:", error);
      }
      setIsReaderOpen(false);
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex flex-row mt-4 gap-2">
        <button
          onClick={openNormalReader}
          className="flex items-center font-bold px-5 py-2 2xl:px-6 2xl:py-4 rounded-lg leading-none uppercase text-sand bg-lilah border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl cursor-pointer transition-all duration-300"
        >
          <BookCheckIcon size={20} className="mr-2" />
          {intl.manga.read as string}
        </button>

        <button
          onClick={openYoureiReader}
          title="Leer de incógnito"
          className="p-3 2xl:p-4 rounded-lg leading-none uppercase text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl cursor-pointer transition-all duration-300"
        >
          <HatGlassesIcon size={20} />
        </button>

        <button
          onClick={toggleRead}
          disabled={isLoading}
          title={isRead ? "Marcar como no leído" : "Marcar como leído"}
          className={clsx(
            "p-3 2xl:p-4 rounded-lg leading-none border transition-all duration-300 cursor-pointer",
            {
              "text-onix bg-sand border-sand hover:bg-pearl hover:border-pearl":
                isRead,
              "text-sand bg-blackamber border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl":
                !isRead,
            },
          )}
        >
          <CheckIcon size={20} />
        </button>

        <button
          onClick={toggleFavorite}
          disabled={isLoading}
          title={isFavorite ? "Eliminar de favoritos" : "Marcar como favorito"}
          className={clsx(
            "p-3 2xl:p-4 rounded-lg leading-none border transition-all duration-300 cursor-pointer",
            {
              "text-onix bg-sand border-sand hover:bg-pearl hover:border-pearl":
                isFavorite,
              "text-sand bg-blackamber border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl":
                !isFavorite,
            },
          )}
        >
          {isFavorite ? <HeartOffIcon size={20} /> : <HeartIcon size={20} />}
        </button>
      </div>

      <MangaReader
        isOpen={isReaderOpen}
        onClose={handleClose}
        slug={slug}
        intl={intl}
        isYoureiMode={isYoureiMode}
        readingDirection={readingDirection}
        coverSrc={coverSrc}
        mangaTitle={volumeTitle}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        volumeId={volumeId}
        communityRating={communityRating}
        initialPersonalRating={initialPersonalRating}
      />
    </>
  );
}
