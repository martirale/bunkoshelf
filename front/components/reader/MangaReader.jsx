"use client";

import { useEffect, useState } from "react";
import { Minimize2 } from "lucide-react";

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

  if (loading) return <div className="p-4 text-center">Cargando...</div>;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-4">
      <button onClick={onClose} className="absolute top-4 right-4 z-50">
        <Minimize2 className="w-8 h-8 hover:scale-90 transition-all duration-300 cursor-pointer" />
      </button>

      <div className="flex-grow flex items-center justify-center">
        {images.length > 0 ? (
          <img
            src={images[currentIndex]}
            alt={`Página ${images.length - currentIndex}`}
            className="max-h-[90vh] w-auto shadow-lg"
          />
        ) : (
          <p className="text-white">No se encontraron páginas.</p>
        )}
      </div>

      <div className="flex justify-between w-full max-w-md mt-4 text-white">
        <button
          onClick={goPrev}
          disabled={currentIndex >= images.length - 1}
          className="p-2 disabled:opacity-30"
        >
          ⬅️
        </button>

        <span>
          Página {currentIndex + 1} de {images.length}
        </span>

        <button
          onClick={goNext}
          disabled={currentIndex <= 0}
          className="p-2 disabled:opacity-30"
        >
          ➡️
        </button>
      </div>
    </div>
  );
}
