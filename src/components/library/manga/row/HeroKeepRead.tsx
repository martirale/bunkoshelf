"use client";

import { useRef, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import MangaCard from "@/components/ui/MangaCard";
import MangaNav from "@/components/library/manga/MangaNav";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import {
  getLibraryVolumeHref,
  type LibraryScope,
  type LibrarySection,
} from "@/lib/librarySection";
import {
  LibraryBigIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { getMangaVolumes } from "@/actions/library";
import type { Locale, Dictionary } from "@/lib/types";
import type { MouseEvent as ReactMouseEvent, DragEvent } from "react";

interface HeroKeepReadProps {
  lang: Locale;
  intl: Dictionary;
  section?: LibrarySection;
  scope?: LibraryScope;
}

interface ReadingEntry {
  slug: string;
  title: string;
  isOneshot: boolean;
  coverImage: string | null;
  meta: {
    title?: string | null;
  } | null;
  lastPage: number;
  totalPages: number;
  lastReadAt: Date | null;
  progressRatio: number;
}

export default function HeroKeepRead({
  lang,
  intl,
  section = "manga",
  scope = "all",
}: HeroKeepReadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<ReadingEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const hasDragged = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchReadingProgress() {
      const result = await getMangaVolumes({ scope });
      if (!result || !result.success) return;

      const data = result.data;
      if (!data) return;

      const filtered = data
        .map((vol) => {
          const progress = vol.usersProgress?.[0] || null;

          return {
            ...vol,
            isOneshot: vol.series?.isOneshot === true,
            coverImage: getMangaCoverUrl(vol),
            meta: vol.metadataObj || null,
            lastPage: progress?.lastPage ?? 0,
            totalPages: progress?.totalPages ?? 0,
            lastReadAt: progress?.lastReadAt
              ? new Date(progress.lastReadAt)
              : null,
            progressRatio:
              progress?.totalPages && progress.totalPages > 0
                ? ((progress.lastPage ?? 0) + 1) / progress.totalPages
                : 0,
          };
        })
        .filter((vol) => {
          if (!vol.lastReadAt) return false;
          const notStarted = vol.lastPage === 0;
          const alreadyFinished = vol.lastPage >= vol.totalPages - 1;
          return !notStarted && !alreadyFinished;
        })
        .sort(
          (a, b) =>
            (b.lastReadAt as Date).getTime() - (a.lastReadAt as Date).getTime(),
        );

      setEntries(filtered);
    }

    fetchReadingProgress();
  }, [pathname, scope]);

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

  const shouldHideHero = (() => {
    const parts = pathname.split("/").filter(Boolean);

    if (parts[1] !== section) return true;

    if (parts.length === 2) return false;

    if (parts.length === 3) {
      return !["series", "volumes", "toread"].includes(parts[2]);
    }

    return true;
  })();

  return (
    <>
      {!shouldHideHero && (
        <>
          <section className="w-full px-4 pt-4 bg-pearl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="flex items-center text-base md:text-lg text-onix">
                <LibraryBigIcon size={28} className="mr-2" />
                {intl.libraries.keepReading as string}
              </h2>
              <div className="flex gap-4 text-onix">
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
                const href = getLibraryVolumeHref(lang, section, entry.slug);
                return (
                  <div
                    key={entry.slug}
                    className="flex-shrink-0 w-1/2 md:w-1/4 2xl:w-1/5"
                  >
                    <MangaCard
                      title={
                        (entry.meta as Record<string, string>)?.title ??
                        entry.title
                      }
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
                      progressRatio={entry.progressRatio}
                      className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-xl"
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <div className="sticky top-0 z-10 bg-pearl p-4">
            <MangaNav lang={lang} intl={intl} section={section} scope={scope} />
          </div>
        </>
      )}
    </>
  );
}
