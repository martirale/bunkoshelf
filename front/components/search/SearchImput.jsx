"use client";

import { useEffect, useState } from "react";
import { openSearchModal } from "@/hooks/useSearchModal";
import { Search } from "lucide-react";

export default function SearchInput({ intl }) {
  const [shortcut, setShortcut] = useState("Ctrl+K");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMac =
        navigator.userAgentData?.platform === "macOS" ||
        /Mac/i.test(navigator.userAgent);
      setShortcut(isMac ? "Cmd+K" : "Ctrl+K");
    }
  }, []);

  return (
    <div
      className="flex items-center w-full bg-onix rounded-lg cursor-pointer"
      onClick={openSearchModal}
    >
      <div className="p-1 ml-3">
        <Search className="w-5 h-5" />
      </div>

      <input
        type="text"
        placeholder="Buscar"
        className="w-full p-3 cursor-pointer focus:outline-none"
        readOnly
      />

      <span className="text-sm uppercase bg-blackamber px-3 py-1 mr-4 rounded-md">
        {shortcut}
      </span>
    </div>
  );
}
