"use client";

import { useEffect, useCallback } from "react";
import MangaReader from "./MangaReader";

export default function ReaderModal({
  isOpen,
  onClose,
  slug,
  lang,
  intl,
  isYoureiMode,
}) {
  const goNext = useCallback(() => {
    const event = new CustomEvent("reader:goNext");
    window.dispatchEvent(event);
  }, []);

  const goPrev = useCallback(() => {
    const event = new CustomEvent("reader:goPrev");
    window.dispatchEvent(event);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "ArrowRight") {
        goNext();
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
  }, [isOpen, onClose, goNext, goPrev]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
      <div className="relative w-full h-full max-h-screen overflow-hidden">
        <MangaReader
          slug={slug}
          onClose={onClose}
          lang={lang}
          intl={intl}
          isYoureiMode={isYoureiMode}
        />
      </div>
    </div>
  );
}
