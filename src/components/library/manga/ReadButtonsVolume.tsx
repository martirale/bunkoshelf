"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import OfflineDownloadButton from "@/components/pwa/OfflineDownloadButton";
import Button from "@/components/ui/Button";
import { enqueueOfflineOperation, getOfflineImages, updateOfflineVolume } from "@/lib/client/offlineLibrary";
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
  userId?: string;
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
  userId,
}: ReadButtonsVolumeProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initFavorite);
  const [isRead, setIsRead] = useState(initRead);
  const [isLoading, setIsLoading] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isYoureiMode, setIsYoureiMode] = useState(false);
  const [offlineImages, setOfflineImages] = useState<string[] | undefined>();

  const readingDirection =
    mangaStyle === "YesLTR" || mangaStyle === "No" ? "ltr" : "rtl";

  const openNormalReader = async () => {
    if (userId) {
      const localImages = await getOfflineImages(userId, volumeId);
      if (localImages.length) setOfflineImages(localImages);
    }
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
      if (!navigator.onLine && userId) {
        const localImages = offlineImages?.length ? offlineImages : await getOfflineImages(userId, volumeId);
        const totalPages = localImages.length;
        if (!totalPages) return;
        setOfflineImages(localImages);
        const nextRead = !isRead;
        const now = new Date();
        const localDate = getLocalDateString();
        await updateOfflineVolume(userId, volumeId, { isRead: nextRead, lastPage: nextRead ? totalPages - 1 : 0, totalPages });
        await enqueueOfflineOperation(userId, "read", { volumeId, read: nextRead, totalPages, lastReadAt: now.toISOString(), firstRead: localDate });
        setIsRead(nextRead);
        return;
      }
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
        window.dispatchEvent(new Event("bunko:challenge-updated"));
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
      if (!navigator.onLine && userId) {
        const nextFavorite = !isFavorite;
        await updateOfflineVolume(userId, volumeId, { isFavorite: nextFavorite });
        await enqueueOfflineOperation(userId, "favorite", { volumeId, favorite: nextFavorite });
        setIsFavorite(nextFavorite);
        return;
      }
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

        if (!navigator.onLine && userId) {
          await updateOfflineVolume(userId, volumeId, { lastPage, totalPages, isRead: isFinished });
          await enqueueOfflineOperation(userId, "progress", body);
          if (isFinished) setIsRead(true);
          return;
        }

        const data = await syncReadingProgress(body);

        if (!data || !data.success) {
          console.error("Sync failed:", data && "error" in data ? data.error : "Unknown error");
        }

        if (isFinished && data?.success) {
          setIsRead(true);
          window.dispatchEvent(new Event("bunko:challenge-updated"));
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
        <Button
          onClick={openNormalReader}
          variant="accent"
          className="px-5 py-2 2xl:px-6 2xl:py-4"
        >
          <BookCheckIcon size={20} className="mr-2" />
          {intl.manga.read as string}
        </Button>

        <Button
          onClick={openYoureiReader}
          title="Leer de incógnito"
          variant="dark"
          size="icon"
          className="size-11 2xl:size-13"
        >
          <HatGlassesIcon size={20} />
        </Button>

        <Button
          onClick={toggleRead}
          disabled={isLoading}
          title={isRead ? "Marcar como no leído" : "Marcar como leído"}
          variant={isRead ? "lightAlt" : "dark"}
          size="icon"
          className="size-11 2xl:size-13"
        >
          <CheckIcon size={20} />
        </Button>

        <Button
          onClick={toggleFavorite}
          disabled={isLoading}
          title={isFavorite ? "Eliminar de favoritos" : "Marcar como favorito"}
          variant={isFavorite ? "lightAlt" : "dark"}
          size="icon"
          className="size-11 2xl:size-13"
        >
          {isFavorite ? <HeartOffIcon size={20} /> : <HeartIcon size={20} />}
        </Button>

        <OfflineDownloadButton userId={userId} section={section} slug={slug} volumeId={volumeId} intl={intl} />
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
        offlineImages={offlineImages}
      />
    </>
  );
}
