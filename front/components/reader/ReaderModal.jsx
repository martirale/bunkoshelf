"use client";

import { useEffect } from "react";
import MangaReader from "./MangaReader";

export default function ReaderModal({ isOpen, onClose, slug }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
      <div className="relative w-full h-full max-h-screen overflow-hidden">
        <MangaReader slug={slug} onClose={onClose} />
      </div>
    </div>
  );
}
