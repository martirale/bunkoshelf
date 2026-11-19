"use client";

import { useState } from "react";
import {
  BookCheckIcon,
  HatGlassesIcon,
  CheckIcon,
  HeartIcon,
  HeartOffIcon,
} from "lucide-react";
import MangaReader, { type MangaReaderPosition } from "@/components/reader/MangaReader";
import { toggleVolumeFavorite } from "@/actions/favorites";
import { updateReadState } from "@/actions/read";
import { getReadingProgress } from "@/actions/reader";
import { syncReadingProgress } from "@/actions/progress";
import { sendPush } from "@/actions/web-push";
import OfflineDownloadButton from "@/components/pwa/OfflineDownloadButton";
import Button from "@/components/ui/Button";
import { enqueueOfflineOperation, flushOfflineOperations, getOfflineImages, getOfflineVolume, saveOfflineMangaProgress, updateOfflineVolume } from "@/lib/client/offlineLibrary";
import {
  publishResourceState,
  useResourceMutation,
  useResourceRefresh,
  useResourceState,
} from "@/lib/client/resourceState";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isYoureiMode, setIsYoureiMode] = useState(false);
  const [offlineReader, setOfflineReader] = useState<{ images: string[]; lastPage: number }>();
  const offlineImages = offlineReader?.images;
  const { isFavorite = initFavorite, isRead = initRead } = useResourceState(
    "manga-volume",
    volumeId,
    { isFavorite: initFavorite, isRead: initRead },
  );
  const mutateResource = useResourceMutation();
  const refreshResources = useResourceRefresh();

  const readingDirection =
    mangaStyle === "YesLTR" || mangaStyle === "No" ? "ltr" : "rtl";

  const openNormalReader = async () => {
    setIsLoading(true);
    try {
      setOfflineReader(undefined);
      if (userId) {
        const [images, volume] = await Promise.all([getOfflineImages(userId, volumeId), getOfflineVolume(userId, volumeId)]);
        if (images.length) {
          let lastPage = volume?.lastPage ?? 0;
          if (navigator.onLine) {
            await flushOfflineOperations(userId).catch(() => undefined);
            const remote = await getReadingProgress({ slug }).catch(() => null);
            if (remote?.lastReadAt && (!volume?.lastReadAt || new Date(remote.lastReadAt) >= new Date(volume.lastReadAt))) {
              lastPage = remote.lastPage ?? 0;
            }
          }
          setOfflineReader({ images, lastPage });
        }
      }
    } catch (error) {
      console.error("Error opening downloaded volume:", error);
    } finally {
      setIsLoading(false);
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
        const nextRead = !isRead;
        const now = new Date();
        const localDate = getLocalDateString();
        await updateOfflineVolume(userId, volumeId, { isRead: nextRead, lastPage: nextRead ? totalPages - 1 : 0, totalPages, lastReadAt: now.toISOString() });
        await enqueueOfflineOperation(userId, "read", { volumeId, read: nextRead, totalPages, lastReadAt: now.toISOString(), firstRead: localDate });
        publishResourceState("manga-volume", volumeId, { isRead: nextRead });
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

      const result = await mutateResource({
        resource: "manga-volume",
        id: volumeId,
        patch: { isRead: !isRead },
        mutate: () => updateReadState({
          volumeId,
          read: !isRead,
          totalPages,
          lastReadAt: !isRead ? now.toISOString() : undefined,
          firstRead: !isRead ? localDate : undefined,
        }),
        isSuccess: (value) => Boolean(value?.success),
      });

      if (!result) return;

      if (result.success) {
        if (userId) await updateOfflineVolume(userId, volumeId, {
          isRead: !isRead,
          lastPage: !isRead ? totalPages - 1 : 0,
          totalPages,
          lastReadAt: now.toISOString(),
        }).catch(() => undefined);
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
        publishResourceState("manga-volume", volumeId, { isFavorite: nextFavorite });
        return;
      }
      const result = await mutateResource({
        resource: "manga-volume",
        id: volumeId,
        patch: { isFavorite: !isFavorite },
        mutate: () => toggleVolumeFavorite({ volumeId, favorite: !isFavorite }),
        isSuccess: (value) => Boolean(value?.success),
      });

      if (!result) return;

      if (!result.success && "error" in result) {
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

  const storePosition = (position: MangaReaderPosition) => {
    if (!userId || !offlineImages?.length) return;
    void saveOfflineMangaProgress(userId, volumeId, position, !navigator.onLine)
      .catch((error) => console.error("Error saving offline position:", error));
  };

  const handleClose = async (position: MangaReaderPosition | null) => {
    let error: unknown = null;

    try {
      if (position && !isYoureiMode) {
        const isFinished = position.lastPage >= position.totalPages - 1;
        const body = { volumeSlug: slug, ...position };

        if (!navigator.onLine && userId) {
          await saveOfflineMangaProgress(userId, volumeId, position, true);
          publishResourceState("manga-volume", volumeId, { isRead: isFinished });
          return;
        }

        const data = await syncReadingProgress(body);

        if (!data || !("success" in data) || !data.success) {
          console.error("Sync failed:", data?.error ?? "Unknown error");
          return;
        }

        if (data.applied) publishResourceState("manga-volume", volumeId, { isRead: data.isRead });
        if (data.completed) window.dispatchEvent(new Event("bunko:challenge-updated"));

        refreshResources();

        if (data.completed) {
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
      if (position && userId && offlineImages?.length) {
        await saveOfflineMangaProgress(userId, volumeId, position, true).catch(() => undefined);
      }
    } finally {
      if (error) {
        console.error("Error syncing progress:", error);
      }
      setIsReaderOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-row mt-4 gap-2">
        <Button
          onClick={openNormalReader}
          disabled={isLoading}
          variant="accent"
        size="action"
        className="gap-2"
      >
          <BookCheckIcon size={20} />
          {intl.manga.read as string}
        </Button>

        <Button
          onClick={openYoureiReader}
          title="Leer de incógnito"
          variant="dark"
          size="actionIcon"
        >
          <HatGlassesIcon size={20} />
        </Button>

        <Button
          onClick={toggleRead}
          disabled={isLoading}
          title={isRead ? "Marcar como no leído" : "Marcar como leído"}
          variant={isRead ? "lightAlt" : "dark"}
          size="actionIcon"
        >
          <CheckIcon size={20} />
        </Button>

        <Button
          onClick={toggleFavorite}
          disabled={isLoading}
          title={isFavorite ? "Eliminar de favoritos" : "Marcar como favorito"}
          variant={isFavorite ? "lightAlt" : "dark"}
          size="actionIcon"
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
        offlineLastPage={offlineReader?.lastPage}
        onProgress={storePosition}
      />
    </>
  );
}
