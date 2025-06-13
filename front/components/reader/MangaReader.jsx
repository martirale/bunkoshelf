"use client";

import { useEffect, useState } from "react";
import { Minimize2, ChevronLeft, ChevronRight } from "lucide-react";
import Loader from "../ui/Loader";

export default function MangaReader({
  slug,
  lang,
  intl,
  onClose,
  isYoureiMode,
}) {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const storageKey = `reader-progress:${slug}`;

  useEffect(() => {
    if (!slug) return;

    async function fetchPages() {
      setLoading(true);
      try {
        const res = await fetch("/api/reader/manga", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });

        const data = await res.json();

        if (res.ok && data.images?.length) {
          setImages(data.images);

          if (!isYoureiMode) {
            const progressRes = await fetch("/api/reader/progress/get", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug }),
            });

            const progress = await progressRes.json();
            let startIndex = 0;

            if (
              progressRes.ok &&
              typeof progress.lastPage === "number" &&
              progress.lastPage >= 0 &&
              progress.lastPage < data.images.length
            ) {
              startIndex = progress.lastPage;
            }

            setCurrentIndex(startIndex);
          } else {
            setCurrentIndex(0);
          }
        } else {
          console.error(data.error || "No se encontraron imágenes");
        }
      } catch (err) {
        console.error("Reader error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPages();
  }, [slug, isYoureiMode]);

  // Guardar progreso en localStorage
  useEffect(() => {
    if (!isYoureiMode && images.length > 0) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          lastPage: currentIndex,
          totalPages: images.length,
          lastReadAt: new Date().toISOString(),
        })
      );
    }
  }, [currentIndex, images.length, isYoureiMode]);

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  const goPrev = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((i) => i + 1);
      triggerHaptic();
    }
  };

  const goNext = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      triggerHaptic();
    }
  };

  useEffect(() => {
    const handleGoNext = () => goNext();
    const handleGoPrev = () => goPrev();

    window.addEventListener("reader:goNext", handleGoNext);
    window.addEventListener("reader:goPrev", handleGoPrev);

    return () => {
      window.removeEventListener("reader:goNext", handleGoNext);
      window.removeEventListener("reader:goPrev", handleGoPrev);
    };
  }, [currentIndex, images.length]);

  if (loading) return <Loader />;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50"
        title={intl.reader.ttExit}
      >
        <Minimize2 className="w-7 h-7 hover:scale-90 transition-all duration-300 cursor-pointer" />
      </button>

      {/* Zonas táctiles invisibles */}
      <div className="absolute inset-0 z-40 flex">
        {/* Zona izquierda (avanza →) */}
        <div className="w-1/3 h-full" onTouchStart={goPrev} />
        {/* Zona centro (neutral) */}
        <div
          className="w-1/3 h-full"
          onTouchStart={() => {
            console.log("Tocado centro (neutral)");
          }}
        />
        {/* Zona derecha (retrocede ←) */}
        <div className="w-1/3 h-full" onTouchStart={goNext} />
      </div>

      {/* Imágenes */}
      <div className="flex-grow flex items-center justify-center z-30 mt-8 md:mt-0">
        {images.length > 0 ? (
          <img
            src={images[currentIndex]}
            alt={`Página ${images.length - currentIndex}`}
            className="max-h-[93vh] w-auto px-0.5"
          />
        ) : (
          <p>No se encontraron páginas.</p>
        )}
      </div>

      {/* Nav Controls */}
      <div className="flex items-center justify-between w-full max-w-md z-50 mb-5 md:mb-2">
        <button
          onClick={goPrev}
          disabled={currentIndex >= images.length - 1}
          className="p-2 disabled:opacity-30"
          title={intl.reader.ttNext}
        >
          <ChevronLeft className="w-7 h-7 hover:scale-125 transition-all duration-300 cursor-pointer" />
        </button>

        <span>
          {intl.reader.page} {currentIndex + 1} / {images.length}
        </span>

        <button
          onClick={goNext}
          disabled={currentIndex <= 0}
          className="p-2 disabled:opacity-30"
          title={intl.reader.ttPrev}
        >
          <ChevronRight className="w-7 h-7 hover:scale-125 transition-all duration-300 cursor-pointer" />
        </button>
      </div>
    </div>
  );
}
