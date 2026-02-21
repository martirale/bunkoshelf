"use client";

import { useEffect, useState, useRef } from "react";
import {
  Minimize2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  HeartOffIcon,
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import { getMangaImages, getReadingProgress } from "@/actions/reader";

export default function MangaReader({
  isOpen,
  onClose,
  slug,
  intl,
  isYoureiMode,
  readingDirection = "rtl",
  coverSrc,
  mangaTitle,
  isFavorite = false,
  onToggleFavorite,
}) {
  const modalRef = useRef(null);
  const wakeLockRef = useRef(null);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFinishScreen, setShowFinishScreen] = useState(false);

  const storageKey = `reader-progress:${slug}`;
  const isRTL = readingDirection === "rtl";

  useEffect(() => {
    if (!slug) return;

    async function fetchPages() {
      let error = null;

      setLoading(true);
      setShowFinishScreen(false);
      try {
        const data = await getMangaImages({ slug });

        if (data.images?.length) {
          setImages(data.images);

          if (!isYoureiMode) {
            const progress = await getReadingProgress({ slug });
            let startIndex = 0;

            if (
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
        }),
      );
    }
  }, [currentIndex, images.length, isYoureiMode, storageKey]);

  const goPrev = () => {
    if (showFinishScreen) {
      setShowFinishScreen(false);
      return;
    }
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const goNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setShowFinishScreen(true);
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
  }, [isOpen, onClose, currentIndex, images.length, isRTL, showFinishScreen]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const timeout = setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !("wakeLock" in navigator)) return;

    const acquire = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch {
        // El dispositivo no soporta o denegó el wake lock
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;
  if (loading)
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <Loader />
      </div>
    );

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
        <Minimize2Icon
          size={28}
          className="hover:scale-90 transition-all duration-300 cursor-pointer"
        />
      </button>

      {showFinishScreen ? (
        <div className="flex flex-col items-center justify-center flex-grow gap-6 px-8 text-center z-30">
          {coverSrc && (
            <img
              src={coverSrc}
              alt={mangaTitle}
              className="max-h-64 w-auto rounded-lg"
            />
          )}
          {mangaTitle && <h2 className="text-xl">{mangaTitle}</h2>}
          <div className="flex flex-col md:flex-row gap-4 mt-2 w-full md:w-auto">
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                title={
                  isFavorite
                    ? intl.reader.finishUnfavorite
                    : intl.reader.finishFavorite
                }
                className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2 rounded-lg border border-blackamber bg-blackamber text-sand hover:bg-pearl hover:text-onix hover:border-pearl transition-all duration-300 cursor-pointer font-bold uppercase"
              >
                {isFavorite ? (
                  <HeartOffIcon size={20} />
                ) : (
                  <HeartIcon size={20} />
                )}
                {isFavorite
                  ? intl.reader.finishUnfavorite
                  : intl.reader.finishFavorite}
              </button>
            )}
            <button
              onClick={onClose}
              title={intl.reader.ttExit}
              className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2 rounded-lg border border-blackamber bg-blackamber text-sand hover:bg-pearl hover:text-onix hover:border-pearl transition-all duration-300 cursor-pointer font-bold uppercase"
            >
              <Minimize2Icon size={20} />
              {intl.reader.ttExit}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="absolute inset-0 z-40 flex">
            <div
              className="w-1/3 h-full"
              onTouchStart={isRTL ? goNext : goPrev}
            />
            <div className="w-1/3 h-full" />
            <div
              className="w-1/3 h-full"
              onTouchStart={isRTL ? goPrev : goNext}
            />
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
              disabled={isRTL ? false : currentIndex <= 0}
              className="p-2 disabled:opacity-30"
              title={isRTL ? intl.reader.ttNext : intl.reader.ttPrev}
            >
              <ChevronLeftIcon
                size={28}
                className="hover:scale-125 transition-all duration-300 cursor-pointer"
              />
            </button>

            <span>
              {intl.reader.page} {currentPage} / {images.length}
            </span>

            <button
              onClick={isRTL ? goPrev : goNext}
              disabled={isRTL ? currentIndex <= 0 : false}
              className="p-2 disabled:opacity-30"
              title={isRTL ? intl.reader.ttPrev : intl.reader.ttNext}
            >
              <ChevronRightIcon
                size={28}
                className="hover:scale-125 transition-all duration-300 cursor-pointer"
              />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
