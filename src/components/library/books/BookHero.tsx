"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import MangaCard from "@/components/ui/MangaCard";
import BookNav from "@/components/library/books/BookNav";
import { getBookCoverUrl } from "@/lib/books/cover";
import { getBooksInProgress } from "@/actions/books";
import { LibraryBigIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Locale, Dictionary } from "@/lib/types";
import type { MouseEvent as ReactMouseEvent, DragEvent } from "react";

interface ReadingEntry {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  progression: number;
}

export default function BookHero({ lang, intl }: { lang: Locale; intl: Dictionary }) {
  const books = intl.books as Record<string, string>;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<ReadingEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const hasDragged = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchReadingProgress() {
      const result = await getBooksInProgress();
      if (!result.success) return;
      setEntries(result.data);
    }

    fetchReadingProgress();
  }, [pathname]);

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    hasDragged.current = false;
    startX.current = event.pageX - scrollRef.current!.offsetLeft;
    scrollStart.current = scrollRef.current!.scrollLeft;
    document.body.style.cursor = "grabbing";
  };

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    event.preventDefault();
    const x = event.pageX - scrollRef.current!.offsetLeft;
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
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const card = container.querySelector("div > div") as HTMLElement | null;
    const cardWidth = card?.offsetWidth || 200;
    container.scrollBy({ left: cardWidth * 2 * (direction === "left" ? -1 : 1), behavior: "smooth" });
  };

  const parts = pathname.split("/").filter(Boolean);
  const shouldHideHero = parts[1] !== "books"
    || (parts.length === 3 && !["series", "volumes", "toread"].includes(parts[2]))
    || parts.length > 3;

  if (shouldHideHero) return null;

  return (
    <>
      <section className="w-full px-4 pt-4 bg-pearl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="flex items-center text-base md:text-lg text-onix">
            <LibraryBigIcon size={28} className="mr-2" />
            {intl.libraries.keepReading as string}
          </h2>
          <div className="flex gap-4 text-onix">
            <button onClick={() => scrollCards("left")} className="cursor-pointer" aria-label={books.previousBooks}>
              <ChevronLeftIcon size={28} className="hover:scale-110 transition-all duration-150" />
            </button>
            <button onClick={() => scrollCards("right")} className="cursor-pointer" aria-label={books.nextBooks}>
              <ChevronRightIcon size={28} className="hover:scale-110 transition-all duration-150" />
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
          onDragStart={(event: DragEvent) => event.preventDefault()}
          onClickCapture={(event) => {
            if (hasDragged.current) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
        >
          {entries.map((entry) => (
            <div key={entry.slug} className="flex-shrink-0 w-1/2 md:w-1/4 2xl:w-1/5">
              <MangaCard
                title={entry.title}
                href={`/${lang}/books/volume/${entry.slug}`}
                isSeries={false}
                isOneshot={false}
                onGoing={false}
                onPause={false}
                volumeCount={null}
                cover={getBookCoverUrl(entry.slug, entry.coverImage)}
                intl={intl}
                isDragging={isDragging}
                seriesSlug={null}
                progressRatio={entry.progression}
                offlineVolumeId={entry.id}
                className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-xl"
              />
            </div>
          ))}
        </div>
      </section>
      <div className="sticky top-0 z-10 bg-pearl p-4">
        <BookNav lang={lang} intl={intl} />
      </div>
    </>
  );
}
