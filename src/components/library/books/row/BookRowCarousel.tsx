"use client";

import { useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import MangaCard from "@/components/ui/MangaCard";
import { getBookCoverUrl } from "@/lib/books/cover";
import type { BookVolume } from "@/lib/db/books/library";
import type { Dictionary } from "@/lib/types";
import { getBookProgressRatio } from "@/lib/books/readingProgress";
import type { MouseEvent as ReactMouseEvent, DragEvent, ReactNode } from "react";

interface BookRowCarouselProps {
  books: BookVolume[];
  lang: string;
  intl: Dictionary;
  header: ReactNode;
  className?: string;
  progressById?: Record<string, { isRead: boolean; progression: number | null }>;
}

export default function BookRowCarousel({
  books,
  lang,
  intl,
  header,
  className = "mt-8",
  progressById = {},
}: BookRowCarouselProps) {
  const booksDictionary = intl.books as Record<string, string>;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const hasDragged = useRef(false);

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
    if (scrollRef.current) {
      const container = scrollRef.current;
      const card = container.querySelector("div > div") as HTMLElement | null;
      const cardWidth = card?.offsetWidth || 200;
      const scrollAmount = cardWidth * 2 * (direction === "left" ? -1 : 1);
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className={className}>
      <div className="flex justify-between items-center mb-4">
        {header}
        <div className="flex gap-4">
          <button onClick={() => scrollCards("left")} className="cursor-pointer" aria-label={booksDictionary.previousBooks}>
            <ChevronLeftIcon size={28} className="hover:scale-110 transition-all duration-150" />
          </button>
          <button onClick={() => scrollCards("right")} className="cursor-pointer" aria-label={booksDictionary.nextBooks}>
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
        {books.map((book) => (
          <div key={book.slug} className="flex-shrink-0 w-1/2 md:w-1/5 2xl:w-1/7">
            <MangaCard
              title={book.metadata.title}
              href={`/${lang}/books/volume/${book.slug}`}
              isSeries={false}
              isOneshot={book.series.isOneshot}
              onGoing={false}
              onPause={false}
              volumeCount={null}
              cover={getBookCoverUrl(book.slug, book.metadata.coverPath)}
              intl={intl}
              isDragging={isDragging}
              seriesSlug={null}
              progressRatio={getBookProgressRatio(progressById[book.id])}
              offlineVolumeId={book.id}
              className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
