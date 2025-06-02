"use client";

import { useRef, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import MangaCard from "@/ui/library/manga/MangaCard";
import MangaNav from "@/ui/library/manga/MangaNav";
import { LibraryBig, ChevronLeft, ChevronRight } from "lucide-react";

export default function HeroKeepRead({ lang, intl }) {
  const scrollRef = useRef(null);
  const [entries, setEntries] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const hasDragged = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchReadingProgress() {
      const res = await fetch("/api/library/manga/volumes");
      const { data } = await res.json();

      const filtered = data
        .map((vol) => {
          const progress = vol.usersProgress?.[0] || null;

          return {
            ...vol,
            isOneshot: vol.series?.isOneshot === true,
            coverImage: vol.coverImage
              ? `/api/library/manga/cover${vol.coverImage
                  .replace(/\\/g, "/")
                  .replace(/^\/?covers/, "")}`
              : null,
            meta: vol.metadataObj || null,
            lastPage: progress?.lastPage ?? 0,
            totalPages: progress?.totalPages ?? 0,
            lastReadAt: progress?.lastReadAt
              ? new Date(progress.lastReadAt)
              : null,
          };
        })
        .filter((vol) => {
          if (!vol.lastReadAt) return false;
          const notStarted = vol.lastPage === 0;
          const alreadyFinished = vol.lastPage >= vol.totalPages - 1;
          return !notStarted && !alreadyFinished;
        })
        .sort((a, b) => b.lastReadAt - a.lastReadAt);

      setEntries(filtered);
    }

    fetchReadingProgress();
  }, [pathname]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    hasDragged.current = false;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollStart.current = scrollRef.current.scrollLeft;
    document.body.style.cursor = "grabbing";
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const delta = Math.abs(x - startX.current);
    if (delta > 5) hasDragged.current = true;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollStart.current - walk;
  };

  const stopDragging = () => {
    setIsDragging(false);
    setTimeout(() => {
      hasDragged.current = false;
    }, 0);
    document.body.style.cursor = "default";
  };

  const scrollCards = (direction) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const card = container.querySelector("div > div");
      const cardWidth = card?.offsetWidth || 200;
      const scrollAmount = cardWidth * 2 * (direction === "left" ? -1 : 1);
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Extraemos segmentos para facilitar comparación
  const shouldHideHero = (() => {
    const sp = pathname.split("/");
    return (
      (sp.length === 4 &&
        sp[2] === "manga" &&
        !["series", "volumes", "volume"].includes(sp[3])) ||
      (sp.length === 5 && sp[2] === "manga" && sp[3] === "volume")
    );
  })();

  return (
    <>
      {!shouldHideHero && (
        <section className="w-full p-4 bg-pearl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="flex items-center text-base md:text-lg text-onix">
              <LibraryBig className="w-6 h-6 md:w-7 md:h-7 mr-2" />
              {intl.libraries.keepReading}
            </h2>
            <div className="flex gap-4 text-onix">
              <button
                onClick={() => scrollCards("left")}
                className="cursor-pointer"
              >
                <ChevronLeft className="w-7 h-7 hover:scale-110 transition-all duration-150" />
              </button>
              <button
                onClick={() => scrollCards("right")}
                className="cursor-pointer"
              >
                <ChevronRight className="w-7 h-7 hover:scale-110 transition-all duration-150" />
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
            onDragStart={(e) => e.preventDefault()}
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
                  className="flex-shrink-0 w-1/2 md:w-1/4 2xl:w-1/5"
                >
                  <MangaCard
                    title={entry.meta?.title ?? entry.title}
                    href={href}
                    isSeries={false}
                    isOneshot={entry.isOneshot}
                    volumeCount={null}
                    cover={entry.coverImage}
                    intl={intl}
                    isDragging={isDragging}
                    className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
                  />
                </div>
              );
            })}
          </div>

          <MangaNav lang={lang} intl={intl} />
        </section>
      )}
    </>
  );
}
