"use client";

import { useEffect, useState } from "react";
import { DownloadIcon, Trash2Icon } from "lucide-react";
import clsx from "clsx";
import {
  downloadSeriesBySlug,
  downloadVolumeBySlug,
  getDownload,
  getReadyVolumes,
  removeOfflineSeries,
  removeOfflineVolume,
  type OfflineDownload,
} from "@/lib/client/offlineLibrary";
import type { LibrarySection } from "@/lib/librarySection";
import type { Dictionary } from "@/lib/types";

interface OfflineDownloadButtonProps {
  userId?: string;
  section: LibrarySection;
  slug: string;
  volumeId?: string;
  seriesId?: string;
  intl: Dictionary;
}

function ProgressRing({ value }: { value: number }) {
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r={radius} fill="none" stroke="currentColor" strokeOpacity=".3" strokeWidth="2" />
      <circle cx="10" cy="10" r={radius} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" transform="rotate(-90 10 10)" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value)} />
    </svg>
  );
}

export default function OfflineDownloadButton({ userId, section, slug, volumeId, seriesId, intl }: OfflineDownloadButtonProps) {
  const [download, setDownload] = useState<OfflineDownload | null>(null);
  const [seriesProgress, setSeriesProgress] = useState<{ completed: number; total: number } | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const offline = intl.offline as Record<string, string> | undefined;

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);

    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (!userId || !volumeId) return;
    const load = () => void getDownload(userId, volumeId).then(setDownload);
    load();
    window.addEventListener("bunko:offline-change", load);
    return () => window.removeEventListener("bunko:offline-change", load);
  }, [userId, volumeId]);

  const isSeries = !!seriesId;
  const isReady = isSeries
    ? Boolean(seriesProgress && seriesProgress.completed === seriesProgress.total && seriesProgress.total)
    : download?.status === "ready";
  const progress = isSeries
    ? seriesProgress ? seriesProgress.completed / seriesProgress.total : 0
    : download?.totalPages ? download.completedPages / download.totalPages : 0;
  const isDownloading = isSeries ? !!seriesProgress && !isReady : download?.status === "downloading" || download?.status === "queued";

  useEffect(() => {
    if (!userId || !seriesId) return;
    const load = async () => {
      const volumes = await getReadyVolumes(userId, section);
      const ready = volumes.filter((volume) => volume.seriesId === seriesId).length;
      if (ready) setSeriesProgress((current) => current?.total && current.completed < current.total ? { completed: ready, total: current.total } : { completed: ready, total: ready });
    };
    void load();
    window.addEventListener("bunko:offline-change", load);
    return () => window.removeEventListener("bunko:offline-change", load);
  }, [section, seriesId, userId]);

  const handleClick = async () => {
    if (!userId) return;
    if (isReady) {
      const message = isSeries ? offline?.removeSeries : offline?.removeVolume;
      if (!window.confirm(message || "¿Quieres eliminar esta descarga offline?")) return;
      if (isSeries && seriesId) await removeOfflineSeries(userId, seriesId);
      if (!isSeries && volumeId) await removeOfflineVolume(userId, volumeId);
      setSeriesProgress(null);
      setDownload(null);
      return;
    }
    if (!navigator.onLine || isDownloading) return;
    try {
      if (isSeries && seriesId) {
        if (!window.confirm(offline?.downloadSeries || "¿Quieres descargar todos los tomos de esta serie?")) return;
        setSeriesProgress({ completed: 0, total: 1 });
        await downloadSeriesBySlug(userId, section, slug, (completed, total) => setSeriesProgress({ completed, total }));
      } else {
        setDownload({
          key: `${userId}:${volumeId}`,
          userId,
          volumeId: volumeId!,
          status: "queued",
          completedPages: 0,
          totalPages: 0,
          size: 0,
          updatedAt: new Date().toISOString(),
        });
        await downloadVolumeBySlug(userId, section, slug, setDownload);
      }
    } catch (error) {
      console.error("Offline download error:", error);
      window.alert(offline?.downloadError || "No se pudo completar la descarga");
      setSeriesProgress(null);
    }
  };

  const title = isReady ? offline?.remove : isDownloading ? offline?.downloading : offline?.download;
  return (
    <button
      onClick={handleClick}
      disabled={!userId || (!isOnline && !isReady) || isDownloading}
      title={title || "Descargar para leer sin conexión"}
      className={clsx(
        "p-3 2xl:p-4 rounded-lg leading-none border transition-all duration-300 cursor-pointer",
        isReady ? "text-onix bg-sand border-sand hover:bg-pearl hover:border-pearl" : "text-sand bg-blackamber border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl",
      )}
    >
      {isDownloading ? <ProgressRing value={progress} /> : isReady ? <Trash2Icon size={20} /> : <DownloadIcon size={20} />}
    </button>
  );
}
