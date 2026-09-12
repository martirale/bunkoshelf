"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/types";

interface BookSummaryProps {
  summary: string;
  intl: Dictionary;
}

export default function BookSummary({ summary, intl }: BookSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const books = intl.books as Record<string, string>;

  useEffect(() => {
    setExpanded(false);
  }, [pathname]);

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
          {expanded ? <>{books.showLess} <ChevronUpIcon size={16} /></> : <>{books.showMore} <ChevronDownIcon size={16} /></>}
        </button>
      </div>
    </div>
  );
}
