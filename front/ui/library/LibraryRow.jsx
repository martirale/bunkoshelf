"use client";

import React from "react";
import { useRef, useEffect, useState } from "react";
import MangaCard from "./MangaCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function LibraryRow({
  lang,
  intl,
  title,
  icon,
  className,
  maxItems = 18,
}) {
  const scrollRef = useRef(null);
  const [entries, setEntries] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const hasDragged = useRef(false);

  // Fetch manga library
  useEffect(() => {
    async function fetchLibrary() {
      const res = await fetch("/api/library/manga");
      const data = await res.json();
      setEntries(data);
    }

    fetchLibrary();
  }, []);

  // Manejo de arrastre
  const handleMouseDown = (e) => {
    setIsDragging(true); // Inicia el arrastre
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
    setIsDragging(false); // Termina el arrastre
    setTimeout(() => {
      hasDragged.current = false;
    }, 0);
    document.body.style.cursor = "default"; // Restablece el cursor
  };

  // Scroll buttons
  const scrollCards = (direction) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const card = container.querySelector("div > div");
      const cardWidth = card?.offsetWidth || 200;
      const scrollAmount = cardWidth * 2 * (direction === "left" ? -1 : 1);
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Encabezado y botones de desplazamiento */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="flex items-center">
          {icon && React.cloneElement(icon, { className: "w-7 h-7 mr-2" })}
          {title}
        </h2>
        <div className="flex gap-4">
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

      {/* Contenedor con scroll horizontal y drag */}
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
        {entries.slice(0, maxItems).map((entry) => {
          const href = `${lang}/manga/${entry.slug}`;

          return (
            <div
              key={entry.title}
              className="flex-shrink-0 w-1/2 md:w-1/5 2xl:w-1/6"
            >
              <MangaCard
                title={entry.title}
                href={href}
                isSeries={true}
                isOneshot={entry.isOneshot}
                volumeCount={entry.volumes.length}
                cover={null}
                intl={intl}
                isDragging={isDragging}
                className="text-xs leading-6 2xl:text-sm 2xl:leading-6.5"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
