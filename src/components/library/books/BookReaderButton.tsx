"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { BookCheckIcon, CheckIcon, HeartIcon, HeartOffIcon } from "lucide-react";
import EpubReader from "@/components/reader/EpubReader";
import Button from "@/components/ui/Button";
import { updateBookReadState } from "@/actions/books-reading";
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

  const getLocalDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

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

  const toggleRead = async () => {
    setIsLoading(true);
    try {
      const nextIsRead = !isRead;
      const result = await updateBookReadState({
        slug,
        read: nextIsRead,
        readAt: nextIsRead ? getLocalDateString() : undefined,
      });
      if (!result.success) return;
      setIsRead(nextIsRead);
      if (nextIsRead) window.dispatchEvent(new Event("bunko:challenge-updated"));
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return <>
    <div className="flex flex-row mt-4 gap-2">
      <Button
        onClick={() => setOpen(true)}
        aria-label={books.read}
        variant="accent"
        className="gap-2 px-4 py-3 2xl:px-5 2xl:py-4"
      >
        <BookCheckIcon size={20} />
        <span className="font-bold uppercase">{books.read}</span>
      </Button>
      <Button
        onClick={() => void toggleRead()}
        disabled={isLoading}
        variant={isRead ? "lightAlt" : "dark"}
        size="icon"
        className="size-11 2xl:size-13"
        title={isRead ? books.markUnread : books.markRead}
        aria-label={isRead ? books.markUnread : books.markRead}
      >
        <CheckIcon size={20} />
      </Button>
      <Button
        onClick={() => void updateProgress({ isFavorite: !favorite })}
        disabled={isLoading}
        variant={favorite ? "lightAlt" : "dark"}
        size="icon"
        className="size-11 2xl:size-13"
        title={favorite ? books.removeFavorite : books.addFavorite}
        aria-label={favorite ? books.removeFavorite : books.addFavorite}
      >
        {favorite ? <HeartOffIcon size={20} /> : <HeartIcon size={20} />}
      </Button>
    </div>
    <EpubReader isOpen={open} onClose={() => setOpen(false)} slug={slug} title={title} layout={layout} intl={intl} />
  </>;
}
