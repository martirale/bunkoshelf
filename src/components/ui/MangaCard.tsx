"use client";

import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { useRef } from "react";
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
}: MangaCardProps) {
  const t = intl;
  const ratio = progressRatio ?? 0;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const hasTouchMoved = useRef(false);

  const manga = t.manga as DictionarySection;

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
        <Image
          src={cover || "/placeholder.svg?=v1"}
          alt={`Cover for ${title ?? ""}`}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 20vw, 14vw"
          className="object-cover z-0"
        />

        {ratio > 0 && (
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-blackamber/50">
            <div
              className="h-full bg-lilah transition-all"
              style={{ width: `${Math.min(100, ratio * 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between p-3 h-24 rounded-b-lg border border-blackamber bg-onix group-hover:bg-blackamber">
        <h3
          className={clsx(
            "line-clamp-3 group-hover:text-lilah transition-all duration-300",
            className
          )}
        >
          {title}
        </h3>

        <div className="relative flex items-end justify-between gap-1">
          {isSeries && volumeCount != null && (
            <>
              <p className="mt-2 text-xs uppercase text-neutral-500">
                {volumeCount} {manga.volumes as string}
              </p>
              {onGoing && (
                <span className="bg-cyan-500 text-white text-xs uppercase py-0.5 px-1 rounded">
                  {manga.onGoing as string}
                </span>
              )}
              {onPause && (
                <span className="bg-yellow-500 text-onix text-xs uppercase py-0.5 px-1 rounded">
                  {manga.hiatus as string}
                </span>
              )}
            </>
          )}
          {isOneshot && (
            <span className="bg-lilah text-xs uppercase py-0.5 px-1 rounded">
              Oneshot
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
