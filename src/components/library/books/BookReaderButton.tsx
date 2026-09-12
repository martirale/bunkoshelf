"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { BookCheckIcon, CheckIcon, HeartIcon, HeartOffIcon } from "lucide-react";
import EpubReader from "@/components/reader/EpubReader";
import type { Dictionary } from "@/lib/types";

interface BookReaderButtonProps {
  slug: string;
  title: string;
  layout: "reflowable" | "pre-paginated";
  intl: Dictionary;
}

export default function BookReaderButton({ slug, title, layout, intl }: BookReaderButtonProps) {
  const router = useRouter();
  const books = intl.books as Record<string, string>;
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

  const updateProgress = async (body: { isRead?: boolean; isFavorite?: boolean; progression?: number }) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reader/books/${encodeURIComponent(slug)}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) return;
      if (body.isFavorite !== undefined) setFavorite(body.isFavorite);
      if (body.isRead !== undefined) {
        setIsRead(body.isRead);
        if (body.isRead) window.dispatchEvent(new Event("bunko:challenge-updated"));
      }
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return <>
    <div className="flex flex-row mt-4 gap-2">
      <button
        onClick={() => setOpen(true)}
        aria-label={books.read}
        className="flex items-center gap-2 px-4 py-3 2xl:px-5 2xl:py-4 rounded-lg leading-none border border-lilah bg-lilah text-pearl hover:bg-pearl hover:text-onix hover:border-pearl transition-all duration-300 cursor-pointer"
      >
        <BookCheckIcon size={20} />
        <span className="font-bold uppercase">{books.read}</span>
      </button>
      <button
        onClick={() => {
          const nextIsRead = !isRead;
          void updateProgress({ isRead: nextIsRead, progression: nextIsRead ? 1 : 0 });
        }}
        disabled={isLoading}
        className={clsx(
          "p-3 2xl:p-4 rounded-lg leading-none border transition-all duration-300 cursor-pointer",
          isRead ? "text-onix bg-sand border-sand hover:bg-pearl hover:border-pearl" : "text-sand bg-blackamber border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl",
        )}
        title={isRead ? books.markUnread : books.markRead}
        aria-label={isRead ? books.markUnread : books.markRead}
      >
        <CheckIcon size={20} />
      </button>
      <button
        onClick={() => void updateProgress({ isFavorite: !favorite })}
        disabled={isLoading}
        className={clsx(
          "p-3 2xl:p-4 rounded-lg leading-none border transition-all duration-300 cursor-pointer",
          favorite ? "text-onix bg-sand border-sand hover:bg-pearl hover:border-pearl" : "text-sand bg-blackamber border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl",
        )}
        title={favorite ? books.removeFavorite : books.addFavorite}
        aria-label={favorite ? books.removeFavorite : books.addFavorite}
      >
        {favorite ? <HeartOffIcon size={20} /> : <HeartIcon size={20} />}
      </button>
    </div>
    <EpubReader isOpen={open} onClose={() => setOpen(false)} slug={slug} title={title} layout={layout} intl={intl} />
  </>;
}
