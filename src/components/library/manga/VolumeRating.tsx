"use client";

import { useState, useRef, useEffect } from "react";
import { StarIcon, MinusIcon, PlusIcon } from "lucide-react";
import { updatePersonalRating } from "@/actions/rating";

const MIN = 0.5;
const MAX = 10;

interface VolumeRatingProps {
  volumeId: string;
  communityRating: number | null;
  initialPersonalRating: number | null;
}

export default function VolumeRating({
  volumeId,
  communityRating,
  initialPersonalRating,
}: VolumeRatingProps) {
  const [personalRating, setPersonalRating] = useState(initialPersonalRating);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState(5);
  const panelRef = useRef<HTMLDivElement>(null);

  const hasPersonal = personalRating !== null && personalRating !== undefined;
  const displayRating = hasPersonal ? personalRating : communityRating;
  const hasRating = displayRating !== null && displayRating !== undefined;

  const closeAndSave = async (value: number) => {
    setIsOpen(false);
    setIsLoading(true);
    const result = await updatePersonalRating({
      volumeId,
      rating: value,
    });
    if (result?.success) {
      setPersonalRating(value);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closeAndSave(draft);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, draft]);

  const openPanel = () => {
    setDraft(hasPersonal ? personalRating! : 5);
    setIsOpen(true);
  };

  const handleRemove = async () => {
    setIsLoading(true);
    const result = await updatePersonalRating({
      volumeId,
      rating: null,
    });
    if (result?.success) {
      setPersonalRating(null);
    }
    setIsLoading(false);
    setIsOpen(false);
  };

  if (!hasRating && !isOpen) {
    return (
      <button
        onClick={openPanel}
        className="mt-4 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
      >
        <StarIcon size={14} />
        <span>Valorar</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => (isOpen ? closeAndSave(draft) : openPanel())}
        className={`flex items-center gap-1.5 text-4xl transition-colors cursor-pointer ${
          hasPersonal
            ? "text-amber-400 hover:text-amber-300"
            : "text-neutral-500 hover:text-neutral-300"
        }`}
      >
        <StarIcon size={20} className={hasPersonal ? "fill-amber-400" : ""} />
        <span className="tabular-nums font-bold">
          {Number(displayRating).toFixed(1)}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              disabled={isLoading || draft <= MIN}
              onClick={() => setDraft((d) => Math.max(MIN, d - 0.5))}
              className="p-1.5 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <MinusIcon size={16} />
            </button>
            <span className="text-2xl font-bold tabular-nums text-neutral-100 w-10 text-center">
              {draft.toFixed(1)}
            </span>
            <button
              disabled={isLoading || draft >= MAX}
              onClick={() => setDraft((d) => Math.min(MAX, d + 0.5))}
              className="p-1.5 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <PlusIcon size={16} />
            </button>
          </div>
          {hasPersonal && (
            <button
              disabled={isLoading}
              onClick={handleRemove}
              className="mt-3 w-full text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Quitar valoración
            </button>
          )}
        </div>
      )}
    </div>
  );
}
