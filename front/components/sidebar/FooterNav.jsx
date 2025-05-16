"use client";

import Link from "next/link";
import { Languages, LogOut, BookOpen } from "lucide-react";
import { usePathname, useParams, useRouter } from "next/navigation";
import SessionStatus from "@/hooks/SessionStatus";

export default function FooterNav({ intl }) {
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

  // Session status
  const isLoggedIn = SessionStatus();

  return (
    <>
      <div className="flex justify-between items-center">
        <Link
          href="#"
          target="_blank"
          rel="noopener"
          className={`text-sm px-4 py-1 border border-zinc-800 rounded-full hover:text-pearl hover:bg-onix transition-all duration-300 ${hoverBorder}`}
        >
          v0.4.0-alpha
        </Link>
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            className={`border border-zinc-800 hover:text-pearl hover:bg-onix rounded-lg p-2 cursor-pointer transition-all duration-300 ${hoverBorder}`}
            aria-label="Switch Language"
            title={intl.tooltip.switchLang}
            onClick={toggleLang}
          >
            <Languages className="w-5 h-5" />
          </button>
          {/* Guides */}
          <Link
            href="#"
            target="_blank"
            rel="noopener"
            title={intl.tooltip.userGuide}
            className={`border border-zinc-800 rounded-lg p-2 hover:text-pearl hover:bg-onix transition-all duration-300 ${hoverBorder}`}
          >
            <BookOpen className="w-5 h-5" />
          </Link>
          {/* Logout Button */}
          {isLoggedIn && (
            <button
              className={`border border-zinc-800 hover:text-pearl hover:bg-onix rounded-lg p-2 cursor-pointer transition-all duration-300 ${hoverBorder}`}
              aria-label="Logout"
              title={intl.tooltip.logout}
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
