"use client";

import { useEffect, useState, useRef } from "react";
import { Minimize2, ChevronLeft, ChevronRight } from "lucide-react";
import Loader from "../ui/Loader";

export default function MangaReader({
  isOpen,
  onClose,
  slug,
  intl,
  isYoureiMode,
  readingDirection = "rtl",
}) {
  const modalRef = useRef(null);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const storageKey = `reader-progress:${slug}`;
  const isRTL = readingDirection === "rtl";

  useEffect(() => {
    if (!slug) return;

    async function fetchPages() {
      let error = null;

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
        error = err;
      } finally {
        if (error) {
          console.error("Reader error:", error);
        }
        setLoading(false);
      }
    }

    fetchPages();
  }, [slug, isYoureiMode, isRTL]);

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
  }, [currentIndex, images.length, isYoureiMode, storageKey]);

  const goPrev = () => {
    if (isRTL) {
      if (currentIndex > 0) setCurrentIndex((i) => i - 1);
    } else {
      if (currentIndex > 0) setCurrentIndex((i) => i - 1);
    }
  };

  const goNext = () => {
    if (isRTL) {
      if (currentIndex < images.length - 1) setCurrentIndex((i) => i + 1);
    } else {
      if (currentIndex < images.length - 1) setCurrentIndex((i) => i + 1);
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (isRTL) {
          goNext();
        } else {
          goPrev();
        }
      } else if (e.key === "ArrowRight") {
        if (isRTL) {
          goPrev();
        } else {
          goNext();
        }
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKey);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose, currentIndex, images.length, isRTL]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const timeout = setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (loading) return <Loader />;

  const currentPage = currentIndex + 1;

  return (
    <div
      id="mob-nav-modal"
      ref={modalRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center pointer-events-auto transition-opacity duration-200 ease-in-out opacity-100"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50"
        title={intl.reader.ttExit}
      >
        <Minimize2 className="w-7 h-7 hover:scale-90 transition-all duration-300 cursor-pointer" />
      </button>

      <div className="absolute inset-0 z-40 flex">
        <div className="w-1/3 h-full" onTouchStart={isRTL ? goNext : goPrev} />
        <div className="w-1/3 h-full" />
        <div className="w-1/3 h-full" onTouchStart={isRTL ? goPrev : goNext} />
      </div>

      <div className="flex-grow flex items-center justify-center z-30 mt-8 md:mt-0">
        {images.length > 0 ? (
          <img
            src={images[currentIndex]}
            alt={`Página ${currentPage}`}
            className="max-h-[93vh] w-auto px-0.5"
          />
        ) : (
          <p>No se encontraron páginas.</p>
        )}
      </div>

      <div className="flex items-center justify-between w-full max-w-md z-50 mb-5 md:mb-2">
        <button
          onClick={isRTL ? goNext : goPrev}
          disabled={
            isRTL ? currentIndex >= images.length - 1 : currentIndex <= 0
          }
          className="p-2 disabled:opacity-30"
          title={isRTL ? intl.reader.ttNext : intl.reader.ttPrev}
        >
          <ChevronLeft className="w-7 h-7 hover:scale-125 transition-all duration-300 cursor-pointer" />
        </button>

        <span>
          {intl.reader.page} {currentPage} / {images.length}
        </span>

        <button
          onClick={isRTL ? goPrev : goNext}
          disabled={
            isRTL ? currentIndex <= 0 : currentIndex >= images.length - 1
          }
          className="p-2 disabled:opacity-30"
          title={isRTL ? intl.reader.ttPrev : intl.reader.ttNext}
        >
          <ChevronRight className="w-7 h-7 hover:scale-125 transition-all duration-300 cursor-pointer" />
        </button>
      </div>
    </div>
  );
}
