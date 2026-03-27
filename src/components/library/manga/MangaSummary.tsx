"use client";

import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import type { Dictionary } from "@/lib/types";

interface MangaSummaryProps {
  meta: Record<string, unknown>;
  intl: Dictionary;
}

export default function MangaSummary({ meta, intl }: MangaSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  if (!meta.summary) return null;

  return (
    <div className="max-w-2xl">
      <p
        className={`${
          !expanded ? "line-clamp-3" : ""
        } transition-all duration-300`}
      >
        {meta.summary as string}
      </p>
      <div className="flex justify-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm text-neutral-600 uppercase underline flex items-center gap-1 cursor-pointer"
        >
          {expanded ? (
            <>
              {intl.manga.showLess as string} <ChevronUpIcon size={16} />
            </>
          ) : (
            <>
              {intl.manga.showMore as string} <ChevronDownIcon size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
