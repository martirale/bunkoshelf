"use client";

import { useEffect, useState } from "react";
import { Minimize2, ChevronLeft, ChevronRight } from "lucide-react";
import Loader from "@/ui/Loader";

export default function MangaReader({ slug, onClose }) {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          setCurrentIndex(0);
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
  }, [slug]);

  const goPrev = () => {
    if (currentIndex < images.length - 1) setCurrentIndex((i) => i + 1);
  };

  const goNext = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
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
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-4">
      <button onClick={onClose} className="absolute top-4 right-4 z-50">
        <Minimize2 className="w-7 h-7 hover:scale-90 transition-all duration-300 cursor-pointer" />
      </button>

      {/* Zonas táctiles invisibles */}
      <div className="absolute inset-0 z-30 flex">
        {/* Zona izquierda (avanza →) */}
        <div className="w-1/3 h-full" onTouchStart={goPrev} />
        {/* Zona centro (neutral) */}
        <div
          className="w-1/3 h-full"
          onTouchStart={() => {
            // Placeholder por si querés meter una función luego
            console.log("Tocado centro (neutral)");
          }}
        />
        {/* Zona derecha (retrocede ←) */}
        <div className="w-1/3 h-full" onTouchStart={goNext} />
      </div>

      <div className="flex-grow flex items-center justify-center z-40">
        {images.length > 0 ? (
          <img
            src={images[currentIndex]}
            alt={`Página ${images.length - currentIndex}`}
            className="max-h-[90vh] w-auto"
          />
        ) : (
          <p>No se encontraron páginas.</p>
        )}
      </div>

      <div className="flex items-center justify-between w-full max-w-md z-40">
        <button
          onClick={goPrev}
          disabled={currentIndex >= images.length - 1}
          className="p-2 disabled:opacity-30"
        >
          <ChevronLeft className="w-7 h-7 hover:scale-125 transition-all duration-300 cursor-pointer" />
        </button>

        <span>
          Página {currentIndex + 1} de {images.length}
        </span>

        <button
          onClick={goNext}
          disabled={currentIndex <= 0}
          className="p-2 disabled:opacity-30"
        >
          <ChevronRight className="w-7 h-7 hover:scale-125 transition-all duration-300 cursor-pointer" />
        </button>
      </div>
    </div>
  );
}
