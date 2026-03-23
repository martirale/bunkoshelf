"use client";

import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";

export default function MangaSummary({ meta, intl }) {
  const [expanded, setExpanded] = useState(false);

  if (!meta.summary) return null;

  return (
    <div className="max-w-2xl">
      <p
        className={`${
          !expanded ? "line-clamp-3" : ""
        } transition-all duration-300`}
      >
        {meta.summary}
      </p>
      <div className="flex justify-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm text-neutral-600 uppercase underline flex items-center gap-1 cursor-pointer"
        >
          {expanded ? (
            <>
              {intl.manga.showLess} <ChevronUpIcon size={16} />
            </>
          ) : (
            <>
              {intl.manga.showMore} <ChevronDownIcon size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
