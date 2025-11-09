"use client";

import { useEffect, useState } from "react";
import { openSearchModal } from "@/hooks/useSearchModal";
import { SearchIcon } from "lucide-react";

export default function SearchInput({ intl }) {
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
      className="flex items-center w-full border border-neutral-800 hover:border-lilah rounded-lg cursor-pointer transition-all duration-300"
      onClick={openSearchModal}
    >
      <div className="p-1 ml-3">
        <SearchIcon size={20} />
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
