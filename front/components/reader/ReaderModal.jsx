"use client";

import { useEffect } from "react";
import { Minimize2 } from "lucide-react";
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
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-h-screen overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-50">
          <Minimize2 className="w-8 h-8 hover:scale-90 transition-all duration-300" />
        </button>
        <MangaReader slug={slug} />
      </div>
    </div>
  );
}
