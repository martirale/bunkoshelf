"use client";

import { useEffect, useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { openSearchModal } from "@/hooks/useSearchModal";
import { Search } from "lucide-react";

export default function SearchInput({ intl }) {
  // Lang options
  const params = useParams();
  const pathname = usePathname();
  const currentLang = params.lang || "es";

  // Check current routes
  const isManga = pathname.startsWith(`/${currentLang}/manga`);
  const isBooks = pathname.startsWith(`/${currentLang}/books`);
  const isSettings = pathname.startsWith(`/${currentLang}/settings`);

  // Custom color borders
  const hoverBorder = isManga
    ? "hover:border-lilah"
    : isBooks
    ? "hover:border-ash"
    : "hover:border-pearl";

  const [shortcut, setShortcut] = useState("Ctrl+K");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMac =
        navigator.userAgentData?.platform === "macOS" ||
        /Mac/i.test(navigator.userAgent);
      setShortcut(isMac ? "⌘K" : "Ctrl+K");
    }
  }, []);

  return (
    <div
      className={`flex items-center w-full bg-blackamber border border-zinc-800 rounded-lg cursor-pointer ${hoverBorder} transition-all duration-300`}
      onClick={openSearchModal}
    >
      <div className="p-1 ml-3">
        <Search className="w-5 h-5" />
      </div>

      <input
        type="text"
        placeholder={intl.search.placeholder}
        className="w-full p-3 cursor-pointer focus:outline-none"
        readOnly
      />

      <span className="text-sm uppercase bg-onix px-3 py-1 mr-4 rounded-md">
        {shortcut}
      </span>
    </div>
  );
}
