"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DownloadIcon, Trash2Icon } from "lucide-react";
import { useAlertDialog } from "@/components/AlertDialogProvider";
import Button from "@/components/ui/Button";
import {
  downloadSeriesBySlug,
  downloadVolumeBySlug,
  getDownload,
  getReadyVolumes,
  getSeriesDownload,
  removeOfflineSeries,
  removeOfflineVolume,
  type OfflineDownload,
  type OfflineLibrarySection,
} from "@/lib/client/offlineLibrary";
import type { Dictionary } from "@/lib/types";

interface OfflineDownloadButtonProps {
  userId?: string;
  section: OfflineLibrarySection;
  slug: string;
  volumeId?: string;
  seriesId?: string;
  seriesVolumeIds?: string[];
  seriesVolumeCount?: number;
  intl: Dictionary;
}

function subscribeOfflineChanges(listener: () => void) {
  window.addEventListener("bunko:offline-change", listener);
  return () => window.removeEventListener("bunko:offline-change", listener);
}

function subscribeSeriesDownloads(listener: () => void) {
  window.addEventListener("bunko:series-download", listener);
  return () => window.removeEventListener("bunko:series-download", listener);
}

function ProgressRing({ value }: { value: number }) {
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className={value === 0 ? "motion-safe:animate-spin" : undefined}>
      <circle cx="10" cy="10" r={radius} fill="none" stroke="currentColor" strokeOpacity=".3" strokeWidth="2" />
      <circle cx="10" cy="10" r={radius} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" transform="rotate(-90 10 10)" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - (value || 0.2))} />
    </svg>
  );
}

export default function OfflineDownloadButton({ userId, section, slug, volumeId, seriesId, seriesVolumeIds, seriesVolumeCount, intl }: OfflineDownloadButtonProps) {
  const [download, setDownload] = useState<OfflineDownload | null>(null);
  const [seriesReady, setSeriesReady] = useState(false);

  const [isOnline, setIsOnline] = useState(false);
  const offline = intl.offline as Record<string, string> | undefined;
  const { alert, confirm } = useAlertDialog()!;

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

  const seriesProgress = useSyncExternalStore(
    subscribeSeriesDownloads,
    () => userId && seriesId ? getSeriesDownload(userId, section, slug) : undefined,
    () => undefined,
  );
  const isSeries = !!seriesId;
  const isDownloading = isSeries ? !!seriesProgress : download?.status === "downloading" || download?.status === "queued";
  const isReady = !isDownloading && (isSeries ? seriesReady : download?.status === "ready");
  const progress = seriesProgress
    ? (seriesProgress.completed + seriesProgress.current) / seriesProgress.total
    : download?.totalPages ? download.completedPages / download.totalPages : 0;

  useEffect(() => {
    if (!userId || !seriesId) return;
    let active = true;
    const load = async () => {
      const volumes = await getReadyVolumes(userId, section);
      if (!active) return;
      if (seriesVolumeIds) {
        const ids = new Set(volumes.map((volume) => volume.id));
        setSeriesReady(seriesVolumeIds.length > 0 && seriesVolumeIds.every((id) => ids.has(id)));
      } else {
        const ready = volumes.filter((volume) => volume.seriesId === seriesId).length;
        setSeriesReady(ready >= (seriesVolumeCount || 1));
      }
    };
    const refresh = () => void load().catch(() => undefined);
    refresh();
    const unsubscribe = subscribeOfflineChanges(refresh);
    return () => { active = false; unsubscribe(); };
  }, [section, seriesId, seriesVolumeCount, seriesVolumeIds, userId]);

  const handleClick = async () => {
    if (!userId) return;
    if (isReady) {
      const message = isSeries ? offline?.removeSeries : offline?.removeVolume;
      if (!await confirm({
        title: isSeries ? offline?.removeSeriesTitle : offline?.removeVolumeTitle,
        description: message || "¿Quieres eliminar esta descarga offline?",
      })) return;
      if (isSeries && seriesId) await removeOfflineSeries(userId, seriesId);
      if (!isSeries && volumeId) await removeOfflineVolume(userId, volumeId);
      setSeriesReady(false);
      setDownload(null);
      return;
    }
    if (!navigator.onLine || isDownloading) return;
    try {
      if (isSeries && seriesId) {
        if (!await confirm({
          title: offline?.downloadSeriesTitle,
          description: offline?.downloadSeries || "¿Quieres descargar todos los tomos de esta serie?",
        })) return;
        await downloadSeriesBySlug(userId, section, slug);
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
      if (volumeId) {
        setDownload(await getDownload(userId, volumeId).catch(() => null));
      }
      await alert({
        title: offline?.downloadErrorTitle,
        description: offline?.downloadError || "No se pudo completar la descarga",
      });
    }
  };

  const title = isReady ? offline?.remove : isDownloading ? offline?.downloading : offline?.download;
  return (
    <Button
      onClick={handleClick}
      disabled={!userId || (!isOnline && !isReady) || isDownloading}
      aria-busy={isDownloading}
      title={title || "Descargar para leer sin conexión"}
      variant={isReady ? "lightAlt" : "dark"}
      size="actionIcon"
    >
      {isDownloading ? <ProgressRing value={progress} /> : isReady ? <Trash2Icon size={20} /> : <DownloadIcon size={20} />}
    </Button>
  );
}
