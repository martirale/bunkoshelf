"use client";

import Link from "next/link";
import { Languages, LogOut, BookOpen } from "lucide-react";
import { usePathname, useParams, useRouter } from "next/navigation";

export default function FooterNav() {
  // Lang options
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentLang = params.lang || "es";

  const toggleLang = () => {
    const newLang = currentLang === "es" ? "en" : "es";
    const pathWithoutLang = pathname.replace(`/${currentLang}`, "");
    router.push(`/${newLang}${pathWithoutLang}`);
  };

  // Check current routes
  const isManga = pathname.startsWith(`/${currentLang}/manga`);
  const isBooks = pathname.startsWith(`/${currentLang}/books`);

  // Custom color borders
  const hoverBorder = isManga
    ? "hover:border-lilah"
    : isBooks
    ? "hover:border-ash"
    : "hover:border-pearl";

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout");
      window.location.href = `/${currentLang}/`;
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <Link
          href="#"
          target="_blank"
          rel="noopener"
          className={`text-sm px-4 py-1 border border-onix rounded-full hover:text-pearl hover:bg-onix transition-all duration-300 ${hoverBorder}`}
        >
          v0.1.0-alpha
        </Link>
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            className={`border border-onix hover:text-pearl hover:bg-onix rounded-lg p-2 cursor-pointer transition-all duration-300 ${hoverBorder}`}
            aria-label="Switch Language"
            onClick={toggleLang}
          >
            <Languages className="w-5 h-5" />
          </button>
          {/* Guides */}
          <Link
            href="#"
            target="_blank"
            rel="noopener"
            className={`border border-onix rounded-lg p-2 hover:text-pearl hover:bg-onix transition-all duration-300 ${hoverBorder}`}
          >
            <BookOpen className="w-5 h-5" />
          </Link>
          {/* Logout Button */}
          <button
            className={`border border-onix hover:text-pearl hover:bg-onix rounded-lg p-2 cursor-pointer transition-all duration-300 ${hoverBorder}`}
            aria-label="Logout"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
