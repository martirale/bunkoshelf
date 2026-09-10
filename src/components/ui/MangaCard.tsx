"use client";

import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { useRef } from "react";
import { CloudIcon } from "lucide-react";
import { usePwa } from "@/components/pwa/PwaProvider";
import type { DictionarySection } from "@/lib/types";

interface MangaCardProps {
  title: string | null | undefined;
  href: string;
  isSeries: boolean;
  isOneshot: boolean;
  onGoing?: boolean;
  onPause?: boolean;
  volumeCount?: number | null;
  cover?: string | null;
  intl: DictionarySection;
  isDragging: boolean;
  className?: string;
  seriesSlug?: string | null;
  progressRatio?: number | null;
  offlineVolumeId?: string | null;
  offlineSeriesId?: string | null;
}

export default function MangaCard({
  title,
  href,
  isSeries,
  isOneshot,
  onGoing,
  onPause,
  volumeCount,
  cover,
  intl,
  isDragging,
  className,
  seriesSlug,
  progressRatio,
  offlineVolumeId,
  offlineSeriesId,
}: MangaCardProps) {
  const t = intl;
  const ratio = progressRatio ?? 0;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const hasTouchMoved = useRef(false);
  const { offlineSlugs, offlineVolumeIds, offlineSeriesIds } = usePwa();

  const manga = t.manga as DictionarySection;
  const volumeSlug = href.split("?")[0].split("/").pop();
  const isOfflineCover = cover?.startsWith("/offline/") ?? false;
  const isOfflineAvailable = isSeries
    ? !!offlineSeriesId && offlineSeriesIds.has(offlineSeriesId)
    : !!offlineVolumeId && offlineVolumeIds.has(offlineVolumeId)
      ? true
      : !!volumeSlug && offlineSlugs.has(volumeSlug);

  return (
    <Link
      href={href}
      className={clsx(
        "group flex flex-col overflow-hidden rounded-t-lg transition-all duration-300",
        isDragging ? "cursor-grabbing" : "cursor-pointer"
      )}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        if (!touch) return;
        touchStart.current = { x: touch.clientX, y: touch.clientY };
        hasTouchMoved.current = false;
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        const start = touchStart.current;
        if (!touch || !start) return;

        const deltaX = Math.abs(touch.clientX - start.x);
        const deltaY = Math.abs(touch.clientY - start.y);

        if (deltaX > 12 || deltaY > 12) {
          hasTouchMoved.current = true;
        }
      }}
      onTouchEnd={() => {
        touchStart.current = null;
        setTimeout(() => {
          hasTouchMoved.current = false;
        }, 0);
      }}
      onTouchCancel={() => {
        touchStart.current = null;
        hasTouchMoved.current = false;
      }}
      onClickCapture={(e) => {
        if (isDragging || hasTouchMoved.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="relative aspect-[7/10.5] w-full flex-shrink-0">
        {isOfflineCover ? (
          // IndexedDB pages are served by the service worker and cannot use Next's image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover ?? undefined}
            alt={`Cover for ${title ?? ""}`}
            className="absolute inset-0 h-full w-full object-cover z-0"
          />
        ) : (
          <Image
            src={cover || "/placeholder.svg?=v1"}
            alt={`Cover for ${title ?? ""}`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 20vw, 14vw"
            className="object-cover z-0"
          />
        )}

        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          {isSeries && volumeCount != null && (
            <span className="bg-neutral-700 text-[10px] leading-none uppercase py-1 px-1.5 rounded">
              {volumeCount} {manga.volumes as string}
            </span>
          )}
          {isSeries && onGoing && (
            <span className="bg-cyan-500 text-white text-[10px] leading-none uppercase py-1 px-1.5 rounded">
              {manga.onGoing as string}
            </span>
          )}
          {isSeries && onPause && (
            <span className="bg-yellow-500 text-onix text-[10px] leading-none uppercase py-1 px-1.5 rounded">
              {manga.hiatus as string}
            </span>
          )}
          {isSeries && isOfflineAvailable && (
            <span className="bg-neutral-700 p-1 rounded" title="Offline">
              <CloudIcon size={12} />
            </span>
          )}
          {!isSeries && isOneshot && (
            <span className="bg-neutral-700 text-[10px] leading-none uppercase py-1 px-1.5 rounded">
              Oneshot
            </span>
          )}
          {!isSeries && isOfflineAvailable && (
            <span className="bg-neutral-700 p-1 rounded" title="Offline">
              <CloudIcon size={12} />
            </span>
          )}
        </div>

        {ratio > 0 && (
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-blackamber/50">
            <div
              className="h-full bg-lilah transition-all"
              style={{ width: `${Math.min(100, ratio * 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center p-2.5 h-14 rounded-b-lg border border-blackamber bg-onix group-hover:bg-blackamber">
        <h3
          title={title ?? ""}
          className={clsx(
            "min-w-0 w-full truncate group-hover:text-lilah transition-all duration-300",
            className
          )}
        >
          {title}
        </h3>
      </div>
    </Link>
  );
}
