"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { BookCheckIcon, CheckIcon, HeartIcon, HeartOffIcon } from "lucide-react";
import EpubReader from "@/components/reader/EpubReader";

interface BookReaderButtonProps {
  slug: string;
  title: string;
  layout: "reflowable" | "pre-paginated";
}

export default function BookReaderButton({ slug, title, layout }: BookReaderButtonProps) {
  const [open, setOpen] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/reader/books/${encodeURIComponent(slug)}/progress`)
      .then((response) => response.ok ? response.json() : null)
      .then((progress) => {
        setFavorite(progress?.isFavorite === true);
        setIsRead(progress?.isRead === true);
      })
      .catch(() => undefined);
  }, [slug]);

  const updateProgress = async (body: Record<string, boolean>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reader/books/${encodeURIComponent(slug)}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) return;
      if ("isFavorite" in body) setFavorite(body.isFavorite);
      if ("isRead" in body) setIsRead(body.isRead);
    } finally {
      setIsLoading(false);
    }
  };

  return <>
    <div className="flex flex-row mt-4 gap-2">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-3 2xl:px-5 2xl:py-4 rounded-lg leading-none border border-lilah bg-lilah text-pearl hover:bg-pearl hover:text-onix hover:border-pearl transition-all duration-300 cursor-pointer"
      >
        <BookCheckIcon size={20} />
        <span className="font-bold uppercase">Leer</span>
      </button>
      <button
        onClick={() => updateProgress({ isRead: !isRead })}
        disabled={isLoading}
        className={clsx(
          "p-3 2xl:p-4 rounded-lg leading-none border transition-all duration-300 cursor-pointer",
          isRead ? "text-onix bg-sand border-sand hover:bg-pearl hover:border-pearl" : "text-sand bg-blackamber border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl",
        )}
        title={isRead ? "Marcar como no leído" : "Marcar como leído"}
      >
        <CheckIcon size={20} />
      </button>
      <button
        onClick={() => updateProgress({ isFavorite: !favorite })}
        disabled={isLoading}
        className={clsx(
          "p-3 2xl:p-4 rounded-lg leading-none border transition-all duration-300 cursor-pointer",
          favorite ? "text-onix bg-sand border-sand hover:bg-pearl hover:border-pearl" : "text-sand bg-blackamber border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl",
        )}
        title={favorite ? "Eliminar de favoritos" : "Marcar como favorito"}
      >
        {favorite ? <HeartOffIcon size={20} /> : <HeartIcon size={20} />}
      </button>
    </div>
    <EpubReader isOpen={open} onClose={() => setOpen(false)} slug={slug} title={title} layout={layout} />
  </>;
}
