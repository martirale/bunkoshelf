"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function MangaSummary({ meta }) {
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
              Mostrar menos <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Mostrar más <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
