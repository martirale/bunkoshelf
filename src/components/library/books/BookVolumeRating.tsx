"use client";

import { useEffect, useRef, useState } from "react";
import { MinusIcon, PlusIcon, StarIcon } from "lucide-react";
import { updateBookRating } from "@/actions/books-rating";
import type { Dictionary } from "@/lib/types";

const MIN_RATING = 0.5;
const MAX_RATING = 10;

interface BookVolumeRatingProps {
  volumeId: string;
  initialPersonalRating: number | null;
  intl: Dictionary;
}

export default function BookVolumeRating({ volumeId, initialPersonalRating, intl }: BookVolumeRatingProps) {
  const books = intl.books as Record<string, string>;
  const [personalRating, setPersonalRating] = useState(initialPersonalRating);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState(5);
  const panelRef = useRef<HTMLDivElement>(null);
  const hasRating = personalRating !== null;

  const save = async (rating: number) => {
    setIsOpen(false);
    setIsLoading(true);
    try {
      const result = await updateBookRating({ volumeId, rating });
      if (result.success) setPersonalRating(rating);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) void save(draft);
    };
    if (isOpen) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [draft, isOpen]);

  const open = () => {
    setDraft(personalRating ?? 5);
    setIsOpen(true);
  };

  const remove = async () => {
    setIsLoading(true);
    try {
      const result = await updateBookRating({ volumeId, rating: null });
      if (result.success) setPersonalRating(null);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  if (!hasRating && !isOpen) {
    return (
      <button type="button" onClick={open} className="mt-4 flex cursor-pointer items-center gap-1.5 text-xl uppercase text-neutral-500 transition-colors hover:text-neutral-300">
        <StarIcon size={20} />
        <span>{books.rate}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => { if (isOpen) void save(draft); else open(); }}
        className={`flex cursor-pointer items-center gap-1.5 text-4xl transition-colors ${
          hasRating ? "text-amber-400 hover:text-amber-300" : "text-neutral-500 hover:text-neutral-300"
        }`}
      >
        <StarIcon size={20} className={hasRating ? "fill-amber-400" : ""} />
        <span className="tabular-nums font-bold">{personalRating?.toFixed(1) ?? draft.toFixed(1)}</span>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-2 rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-lg">
          <div className="flex items-center gap-3">
            <button type="button" disabled={isLoading || draft <= MIN_RATING} onClick={() => setDraft((value) => Math.max(MIN_RATING, value - 0.5))} className="cursor-pointer rounded bg-neutral-800 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700 disabled:cursor-default disabled:opacity-30"><MinusIcon size={16} /></button>
            <span className="w-10 text-center text-2xl font-bold tabular-nums text-neutral-100">{draft.toFixed(1)}</span>
            <button type="button" disabled={isLoading || draft >= MAX_RATING} onClick={() => setDraft((value) => Math.min(MAX_RATING, value + 0.5))} className="cursor-pointer rounded bg-neutral-800 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700 disabled:cursor-default disabled:opacity-30"><PlusIcon size={16} /></button>
          </div>
          {hasRating && <button type="button" disabled={isLoading} onClick={() => void remove()} className="mt-3 w-full cursor-pointer text-xs text-neutral-500 transition-colors hover:text-neutral-300 disabled:cursor-default">{books.removeRating}</button>}
        </div>
      )}
    </div>
  );
}
