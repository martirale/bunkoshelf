"use client";

import { useRef, useEffect, useState } from "react";
import MangaCard from "@/components/ui/MangaCard";
import { BookPlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getMangaVolumes } from "@/actions/library";
import type { Locale, Dictionary } from "@/lib/types";
import type { MouseEvent as ReactMouseEvent, DragEvent } from "react";

interface NewVolsProps {
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

export default function NewVols({ lang, intl, maxItems = 12 }: NewVolsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<VolEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const hasDragged = useRef(false);

  useEffect(() => {
    async function fetchVolumes() {
      const result = await getMangaVolumes();
      if (!result || !result.success) return;

      const data = result.data;
      if (!data) return;

      const sorted = [...data]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, maxItems)
        .map((vol) => ({
          ...vol,
          isOneshot: vol.series?.isOneshot === true,
          coverImage: vol.coverImage
            ? `/api/library/manga/cover/${vol.slug}/${vol.coverImage}`
            : null,
          meta: vol.metadataObj || null,
        }));

      setEntries(sorted);
    }

    fetchVolumes();
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
    <section className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="flex items-center text-base md:text-lg">
          <BookPlusIcon size={28} className="mr-2" />
          {intl.libraries.recentlyAdded as string}
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
