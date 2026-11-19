"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Minimize2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  HeartOffIcon,
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import VolumeRating from "@/components/library/manga/VolumeRating";
import Button from "@/components/ui/Button";
import type { DictionarySection } from "@/lib/types";

export interface MangaReaderPosition {
  lastPage: number;
  totalPages: number;
  lastReadAt: string;
  date: string;
}

interface MangaReaderProps {
  isOpen: boolean;
  onClose: (position: MangaReaderPosition | null) => void;
  onProgress?: (position: MangaReaderPosition) => void;
  slug: string;
  intl: DictionarySection;
  isYoureiMode: boolean;
  readingDirection?: "rtl" | "ltr";
  coverSrc?: string;
  mangaTitle?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  volumeId: string;
  communityRating: number | null;
  initialPersonalRating: number | null;
  offlineImages?: string[];
  offlineLastPage?: number;
}

export default function MangaReader({
  isOpen,
  onClose,
  onProgress,
  slug,
  intl,
  isYoureiMode,
  readingDirection = "rtl",
  coverSrc,
  mangaTitle,
  isFavorite = false,
  onToggleFavorite,
  volumeId,
  communityRating,
  initialPersonalRating,
  offlineImages,
  offlineLastPage = 0,
}: MangaReaderProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFinishScreen, setShowFinishScreen] = useState(false);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState("");

  const positionRef = useRef<MangaReaderPosition | null>(null);
  const indexRef = useRef(0);
  const isRTL = readingDirection === "rtl";

  const reader = intl.reader as DictionarySection;

  useEffect(() => {
    if (!isOpen) return;

    document.body.dataset.readerOpen = "true";
    window.dispatchEvent(new Event("bunko:reader-state"));

    return () => {
      delete document.body.dataset.readerOpen;
      window.dispatchEvent(new Event("bunko:reader-state"));
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !slug) return;

    let cancelled = false;
    positionRef.current = null;
    setImages([]);

    function loadImages(pages: string[], lastPage: unknown) {
      const index = typeof lastPage === "number" && Number.isInteger(lastPage)
        ? Math.max(0, Math.min(lastPage, pages.length - 1)) : 0;
      indexRef.current = index;
      setImages(pages);
      setCurrentIndex(index);
    }

    async function fetchPages() {
      let error: unknown = null;

      setLoading(true);
      setShowFinishScreen(false);
      try {
        if (!isYoureiMode && offlineImages?.length) {
          loadImages(offlineImages, offlineLastPage);
          return;
        }
        const response = await fetch("/api/reader/manga", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, includeProgress: !isYoureiMode }),
        });
        const data = await response.json();

        if (cancelled) return;
        if (response.ok && data.images?.length) {
          loadImages(data.images, isYoureiMode ? 0 : data.progress?.lastPage);
        } else {
          console.error(data && "error" in data ? data.error : "No se encontraron imágenes");
        }
      } catch (err) {
        error = err;
      } finally {
        if (error) {
          console.error("Reader error:", error);
        }
        if (!cancelled) setLoading(false);
      }
    }

    void fetchPages();
    return () => { cancelled = true; };
  }, [isOpen, slug, isYoureiMode, offlineImages, offlineLastPage]);

  const close = useCallback(() => onClose(positionRef.current), [onClose]);

  const changePage = useCallback((index: number, recordCurrent = false) => {
    if (loading || !images.length || index < 0 || index >= images.length) return;
    if (index === indexRef.current && !recordCurrent) return;
    indexRef.current = index;
    setCurrentIndex(index);
    if (isYoureiMode) return;
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const position = { lastPage: index, totalPages: images.length, lastReadAt: now.toISOString(), date };
    positionRef.current = position;
    onProgress?.(position);
  }, [images.length, isYoureiMode, loading, onProgress]);

  const goPrev = useCallback(() => {
    if (showFinishScreen) {
      setShowFinishScreen(false);
      return;
    }
    changePage(indexRef.current - 1);
  }, [changePage, showFinishScreen]);

  const goNext = useCallback(() => {
    if (loading || !images.length) return;
    if (indexRef.current < images.length - 1) {
      changePage(indexRef.current + 1);
    } else {
      if (!positionRef.current) changePage(indexRef.current, true);
      setShowFinishScreen(true);
    }
  }, [changePage, images.length, loading]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
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
  }, [isOpen, close, goNext, goPrev, isRTL]);

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
      <div className="fixed inset-x-0 bottom-0 top-[env(safe-area-inset-top)] z-[60] bg-black flex items-center justify-center">
        <Loader />
      </div>
    );

  const currentPage = currentIndex + 1;

  return (
    <div
      id="mob-nav-modal"
      ref={modalRef}
      tabIndex={-1}
      className="fixed inset-x-0 bottom-0 top-[env(safe-area-inset-top)] z-[60] bg-black flex flex-col items-center justify-center pointer-events-auto transition-opacity duration-200 ease-in-out opacity-100"
    >
      <button
        onClick={close}
        className="absolute top-4 right-4 z-50"
        title={reader.ttExit as string}
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
              className="max-h-64 md:max-h-81 2xl:max-h-96 w-auto rounded-lg"
            />
          )}
          {mangaTitle && <h2 className="text-xl">{mangaTitle}</h2>}
          <VolumeRating
            volumeId={volumeId}
            communityRating={communityRating}
            initialPersonalRating={initialPersonalRating}
          />
          <div className="flex flex-col md:flex-row gap-4 mt-2 w-full md:w-auto">
            {onToggleFavorite && (
              <Button
                onClick={onToggleFavorite}
                title={
                  isFavorite
                    ? reader.finishUnfavorite as string
                    : reader.finishFavorite as string
                }
                variant="dark"
                className="w-full gap-2 px-5 py-2 md:w-auto"
              >
                {isFavorite ? (
                  <HeartOffIcon size={20} />
                ) : (
                  <HeartIcon size={20} />
                )}
                {isFavorite
                  ? reader.finishUnfavorite as string
                  : reader.finishFavorite as string}
              </Button>
            )}
            <Button
              onClick={close}
              title={reader.ttExit as string}
              variant="dark"
              className="w-full gap-2 px-5 py-2 md:w-auto"
            >
              <Minimize2Icon size={20} />
              {reader.ttExit as string}
            </Button>
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
              title={isRTL ? reader.ttNext as string : reader.ttPrev as string}
            >
              <ChevronLeftIcon
                size={28}
                className="hover:scale-125 transition-all duration-300 cursor-pointer"
              />
            </button>

            <span className="select-none">
              {reader.page as string}{" "}
              {isEditingPage ? (
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pageInput}
                  autoFocus
                  onChange={(e) =>
                    setPageInput(e.target.value.replace(/\D/g, ""))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const n = parseInt(pageInput, 10);
                      if (!isNaN(n) && n >= 1 && n <= images.length) {
                        changePage(n - 1);
                      }
                      setIsEditingPage(false);
                    } else if (e.key === "Escape") {
                      setIsEditingPage(false);
                    }
                    e.stopPropagation();
                  }}
                  onBlur={() => {
                    const n = parseInt(pageInput, 10);
                    if (!isNaN(n) && n >= 1 && n <= images.length) {
                      changePage(n - 1);
                    }
                    setIsEditingPage(false);
                  }}
                  className="w-10 text-center bg-white/10 rounded text-white outline-none"
                />
              ) : (
                <span
                  onClick={() => {
                    setPageInput(String(currentPage));
                    setIsEditingPage(true);
                  }}
                  className="cursor-pointer"
                >
                  {currentPage}
                </span>
              )}{" "}
              / {images.length}
            </span>

            <button
              onClick={isRTL ? goPrev : goNext}
              disabled={isRTL ? currentIndex <= 0 : false}
              className="p-2 disabled:opacity-30"
              title={isRTL ? reader.ttPrev as string : reader.ttNext as string}
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
