"use client";

import { useRef, useEffect, useState } from "react";
import MangaCard from "@/components/ui/MangaCard";
import {
  BookMarkedIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { getMangaVolumes } from "@/actions/library";
import type { Locale, Dictionary } from "@/lib/types";
import type { MouseEvent as ReactMouseEvent, DragEvent } from "react";

interface NextVolProps {
  lang: Locale;
  intl: Dictionary;
  maxItems?: number;
}

interface VolEntry {
  slug: string;
  title: string;
  isOneshot: boolean;
  coverImage: string | null;
  meta: Record<string, unknown> | null;
}

export default function NextVol({ lang, intl, maxItems = 12 }: NextVolProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<VolEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const hasDragged = useRef(false);

  useEffect(() => {
    async function fetchNextVolumes() {
      const result = await getMangaVolumes();
      if (!result || !result.success) return;

      const data = result.data;
      if (!data) return;

      type Vol = (typeof data)[number];
      const seriesMap = new Map<string, Vol[]>();

      data.forEach((vol) => {
        const seriesId = vol.seriesId;
        if (!seriesMap.has(seriesId)) seriesMap.set(seriesId, []);
        seriesMap.get(seriesId)!.push(vol);
      });

      const nextVolumes: VolEntry[] = [];

      function prepVolume(vol: Vol): VolEntry {
        return {
          ...vol,
          coverImage: vol.coverImage
            ? `/api/library/manga/cover/${vol.slug}/${vol.coverImage}`
            : null,
          meta: vol.metadataObj || null,
          isOneshot: vol.series?.isOneshot === true,
        };
      }

      for (const [, volumes] of seriesMap.entries()) {
        const sorted = volumes
          .map((vol) => {
            const progress = vol.usersProgress?.[0] || null;
            return {
              ...vol,
              volumeNumber: Number(vol.metadataObj?.number) || 0,
              isRead: progress?.isRead ?? false,
              lastReadAt: progress?.lastReadAt
                ? new Date(progress.lastReadAt)
                : null,
            };
          })
          .sort((a, b) => a.volumeNumber - b.volumeNumber);

        const hasStarted = sorted.some((v) => v.isRead || v.lastReadAt);
        if (!hasStarted) {
          continue;
        }

        const nextUnread = sorted.find((v) => !v.isRead && !v.lastReadAt);

        if (nextUnread) {
          nextVolumes.push(prepVolume(nextUnread));
        }
      }

      setEntries(nextVolumes.slice(0, maxItems));
    }

    fetchNextVolumes();
  }, [maxItems]);

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    hasDragged.current = false;
    startX.current = e.pageX - scrollRef.current!.offsetLeft;
    scrollStart.current = scrollRef.current!.scrollLeft;
    document.body.style.cursor = "grabbing";
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current!.offsetLeft;
    const delta = Math.abs(x - startX.current);
    if (delta > 5) hasDragged.current = true;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current!.scrollLeft = scrollStart.current - walk;
  };

  const stopDragging = () => {
    setIsDragging(false);
    setTimeout(() => {
      hasDragged.current = false;
    }, 0);
    document.body.style.cursor = "default";
  };

  const scrollCards = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const card = container.querySelector("div > div") as HTMLElement | null;
      const cardWidth = card?.offsetWidth || 200;
      const scrollAmount = cardWidth * 2 * (direction === "left" ? -1 : 1);
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="flex items-center text-base md:text-lg">
          <BookMarkedIcon size={28} className="mr-2" />
          {intl.libraries.inProgress as string}
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => scrollCards("left")}
            className="cursor-pointer"
          >
            <ChevronLeftIcon
              size={28}
              className="hover:scale-110 transition-all duration-150"
            />
          </button>
          <button
            onClick={() => scrollCards("right")}
            className="cursor-pointer"
          >
            <ChevronRightIcon
              size={28}
              className="hover:scale-110 transition-all duration-150"
            />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-none flex gap-4"
        style={{ WebkitOverflowScrolling: "touch", cursor: "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onDragStart={(e: DragEvent) => e.preventDefault()}
        onClickCapture={(e) => {
          if (hasDragged.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {entries.map((entry) => {
          const href = `/${lang}/manga/volume/${entry.slug}`;
          return (
            <div
              key={entry.slug}
              className="flex-shrink-0 w-1/2 md:w-1/5 2xl:w-1/7"
            >
              <MangaCard
                title={(entry.meta as Record<string, string>)?.title ?? entry.title}
                href={href}
                isSeries={false}
                isOneshot={entry.isOneshot}
                onGoing={false}
                onPause={false}
                volumeCount={null}
                cover={entry.coverImage}
                intl={intl}
                isDragging={isDragging}
                seriesSlug={null}
                progressRatio={null}
                className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
