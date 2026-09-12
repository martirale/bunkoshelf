"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import type { Dictionary } from "@/lib/types";

interface BookSummaryProps {
  summary: string;
  intl: Dictionary;
}

export default function BookSummary({ summary, intl }: BookSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="max-w-2xl">
      <p className={`${expanded ? "" : "line-clamp-3"} whitespace-pre-line leading-relaxed transition-all duration-300`}>
        {summary}
      </p>
      <div className="flex justify-center">
        <button
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 flex cursor-pointer items-center gap-1 text-sm uppercase text-neutral-600 underline"
        >
          {expanded ? <>{intl.manga.showLess as string} <ChevronUpIcon size={16} /></> : <>{intl.manga.showMore as string} <ChevronDownIcon size={16} /></>}
        </button>
      </div>
    </div>
  );
}
