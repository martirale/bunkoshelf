"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
import Link from "next/link";

export default function SearchInputMob({ intl }) {
  // Lang options
  const params = useParams();
  const currentLang = params.lang || "es";

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
    <Link
      href={`/${currentLang}/search`}
      className="flex items-center w-full border border-blackamber rounded-lg cursor-pointer transition-all duration-300"
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

      <span className="text-sm uppercase bg-sand px-3 py-1 mr-4 rounded-md">
        {shortcut}
      </span>
    </Link>
  );
}
