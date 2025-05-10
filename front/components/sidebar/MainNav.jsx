"use client";

import Link from "next/link";
import {
  HomeIcon as House,
  LibraryBig,
  ChevronDown,
  ChevronUp,
  BookHeart,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useParams } from "next/navigation";

export default function MainNav({ intl }) {
  // Lang options
  const params = useParams();
  const currentLang = params.lang || "es";
  const pathname = usePathname();

  // Check current routes
  const isHome = pathname === `/${currentLang}`;
  const isManga = pathname.startsWith(`/${currentLang}/manga`);
  const isBooks = pathname.startsWith(`/${currentLang}/books`);
  const isLibrary = isManga || isBooks;
  const isFavorites = pathname.startsWith(`/${currentLang}/favorites`);
  const isProfile = pathname.startsWith(`/${currentLang}/profile`);

  // Drop down
  const [openLibraryMenu, setOpenLibraryMenu] = useState(isLibrary);

  useEffect(() => {
    if (!isLibrary) {
      setOpenLibraryMenu(false);
    }
  }, [pathname]);

  // Custom color borders
  const hoverBorder = isManga
    ? "hover:border-lilah"
    : isBooks
    ? "hover:border-ash"
    : "hover:border-pearl";

  return (
    <>
      <nav className="mt-8 space-y-2 text-xl md:text-lg">
        <Link
          href={`/${currentLang}`}
          className={`flex items-center p-4 rounded-lg leading-none border ${
            isHome
              ? "border-sand bg-onix"
              : `border-blackamber hover:bg-onix ${hoverBorder}`
          } transition-all duration-300`}
        >
          <House className="w-5 h-5 mr-2" />
          {intl.sidebar.home}
        </Link>
        {/* Library (Drop Down) */}
        <div className="relative">
          <button
            onClick={() => setOpenLibraryMenu(!openLibraryMenu)}
            className={`w-full flex items-center justify-between p-4 rounded-lg leading-none cursor-pointer border ${
              isLibrary
                ? isManga
                  ? "border-lilah bg-onix"
                  : "border-ash bg-onix"
                : "border-blackamber hover:border-pearl hover:bg-onix"
            } transition-all duration-300`}
          >
            <span className="flex items-center">
              <LibraryBig className="w-5 h-5 mr-2" />
              {intl.sidebar.library}
            </span>
            {openLibraryMenu ? (
              <ChevronUp className="w-5 h-5 ml-2" />
            ) : (
              <ChevronDown className="w-5 h-5 ml-2" />
            )}
          </button>
          {openLibraryMenu && (
            <div className="mt-2 space-y-2">
              <Link
                href={`/${currentLang}/manga`}
                className={`block pl-12 pr-4 py-4 rounded-lg leading-none transition-all duration-300 ${
                  isManga ? "bg-onix text-lilah" : "hover:bg-onix"
                }`}
              >
                {intl.sidebar.manga}
              </Link>
              <Link
                href={`/${currentLang}/books`}
                className={`block pl-12 pr-4 py-4 rounded-lg leading-none transition-all duration-300 ${
                  isBooks ? "bg-onix text-ash" : "hover:bg-onix"
                }`}
              >
                {intl.sidebar.books}
              </Link>
            </div>
          )}
        </div>
        {/* End Library (Drop Down) */}
        <Link
          href={`/${currentLang}/favorites`}
          className={`flex items-center p-4 rounded-lg leading-none border ${
            isFavorites
              ? "border-sand bg-onix"
              : `border-blackamber hover:bg-onix ${hoverBorder}`
          } transition-all duration-300`}
        >
          <BookHeart className="w-5 h-5 mr-2" />
          {intl.sidebar.favorites}
        </Link>
        <Link
          href={`/${currentLang}/profile`}
          className={`flex items-center p-4 rounded-lg leading-none border ${
            isProfile
              ? "border-sand bg-onix"
              : `border-blackamber hover:bg-onix ${hoverBorder}`
          } transition-all duration-300`}
        >
          <UserRound className="w-5 h-5 mr-2" />
          {intl.sidebar.profile}
        </Link>
      </nav>
    </>
  );
}
