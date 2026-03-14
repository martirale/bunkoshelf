"use client";

import { useState, useRef, useEffect } from "react";
import { StarIcon } from "lucide-react";
import { updatePersonalRating } from "@/actions/rating";

const STEPS = [
  0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5,
  10,
];

export default function VolumeRating({
  volumeId,
  communityRating,
  initialPersonalRating,
}) {
  const [personalRating, setPersonalRating] = useState(initialPersonalRating);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef(null);

  const hasPersonal = personalRating !== null && personalRating !== undefined;
  const displayRating = hasPersonal ? personalRating : communityRating;
  const hasRating = displayRating !== null && displayRating !== undefined;

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = async (value) => {
    const newValue = value === personalRating ? null : value;
    setIsLoading(true);
    const result = await updatePersonalRating({
      volumeId,
      rating: newValue,
    });
    if (result.success) {
      setPersonalRating(newValue);
    }
    setIsLoading(false);
    setIsOpen(false);
  };

  if (!hasRating && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
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
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 text-4xl transition-colors cursor-pointer ${
          hasPersonal
            ? "text-amber-400 hover:text-amber-300"
            : "text-neutral-500 hover:text-neutral-300"
        }`}
      >
        <StarIcon size={20} className={hasPersonal ? "fill-amber-400" : ""} />
        <span className="font-bold">{Number(displayRating).toFixed(1)}</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-lg">
          <div className="grid grid-cols-5 gap-1.5 w-fit">
            {STEPS.map((value) => (
              <button
                key={value}
                disabled={isLoading}
                onClick={() => handleSelect(value)}
                className={`px-2 py-1 text-xs rounded tabular-nums transition-colors cursor-pointer ${
                  value === personalRating
                    ? "bg-amber-400 text-neutral-900 font-bold"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {value.toFixed(1)}
              </button>
            ))}
          </div>
          {hasPersonal && (
            <button
              disabled={isLoading}
              onClick={() => handleSelect(personalRating)}
              className="mt-2 w-full text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Quitar valoración
            </button>
          )}
        </div>
      )}
    </div>
  );
}
