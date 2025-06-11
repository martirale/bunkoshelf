"use client";

import { useEffect } from "react";
import { Minimize2 } from "lucide-react";

export default function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    const handleEscPress = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscPress);
    }

    return () => {
      window.removeEventListener("keydown", handleEscPress);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-pearl text-onix p-6 rounded-lg w-full max-w-5xl space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-onix cursor-pointer"
        >
          <Minimize2 className="w-7 h-7 hover:scale-90 transition-all duration-300" />
        </button>
        <div className="my-5 md:m-4">{children}</div>
      </div>
    </div>
  );
}
