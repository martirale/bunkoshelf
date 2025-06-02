"use client";

import Link from "next/link";
import {
  HomeIcon as House,
  LibraryBig,
  ChevronDown,
  ChevronUp,
  Heart,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useParams } from "next/navigation";
import clsx from "clsx";

export default function MainNav({ intl }) {
  const params = useParams();
  const currentLang = params.lang || "es";
  const pathname = usePathname();

  const isHome = pathname === `/${currentLang}`;
  const isManga = pathname.startsWith(`/${currentLang}/manga`);
  const isBooks = pathname.startsWith(`/${currentLang}/books`);
  const isLibrary = isManga || isBooks;
  const isFavorites = pathname.startsWith(`/${currentLang}/favorites`);
  const isProfile = pathname.startsWith(`/${currentLang}/profile`);

  const [openLibraryMenu, setOpenLibraryMenu] = useState(isLibrary);

  useEffect(() => {
    if (!isLibrary) {
      setOpenLibraryMenu(false);
    }
  }, [pathname]);

  return (
    <nav className="mt-8 space-y-2">
      {/* Home */}
      <Link
        href={`/${currentLang}`}
        className={clsx(
          "flex items-center p-4 rounded-lg leading-none border transition-all duration-300",
          isHome
            ? "border-onix bg-sand text-onix md:border-sand md:bg-onix md:text-sand hover:border-lilah"
            : "border-pearl md:border-blackamber hover:text-pearl hover:border-lilah"
        )}
      >
        <House className="w-5 h-5 mr-2" />
        {intl.sidebar.home}
      </Link>

      {/* Library Dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpenLibraryMenu(!openLibraryMenu)}
          className={clsx(
            "w-full flex items-center justify-between p-4 rounded-lg leading-none cursor-pointer border hover:border-lilah transition-all duration-300",
            isLibrary
              ? "text-onix bg-sand md:text-sand md:bg-onix md:border-pearl"
              : "border-pearl md:border-blackamber hover:text-pearl hover:border-lilah"
          )}
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
              className={clsx(
                "block pl-12 pr-4 py-4 rounded-lg leading-none transition-all duration-300",
                isManga
                  ? "bg-sand text-onix md:bg-onix md:text-sand"
                  : "hover:bg-onix hover:text-pearl"
              )}
            >
              {intl.sidebar.manga}
            </Link>
            <Link
              href={`/${currentLang}/books`}
              className={clsx(
                "block pl-12 pr-4 py-4 rounded-lg leading-none transition-all duration-300",
                isBooks
                  ? "bg-sand text-onix md:bg-onix md:text-sand"
                  : "hover:bg-onix hover:text-pearl"
              )}
            >
              {intl.sidebar.books}
            </Link>
          </div>
        )}
      </div>

      {/* Favorites */}
      <Link
        href={`/${currentLang}/favorites`}
        className={clsx(
          "flex items-center p-4 rounded-lg leading-none border transition-all duration-300",
          isFavorites
            ? "border-onix bg-sand text-onix md:border-sand md:bg-onix md:text-sand hover:border-lilah"
            : "border-pearl md:border-blackamber hover:text-pearl hover:border-lilah"
        )}
      >
        <Heart className="w-5 h-5 mr-2" />
        {intl.sidebar.favorites}
      </Link>

      {/* Profile */}
      <Link
        href={`/${currentLang}/profile`}
        className={clsx(
          "flex items-center p-4 rounded-lg leading-none border transition-all duration-300",
          isProfile
            ? "border-onix bg-sand text-onix md:border-sand md:bg-onix md:text-sand hover:border-lilah"
            : "border-pearl md:border-blackamber hover:text-pearl hover:border-lilah"
        )}
      >
        <UserRound className="w-5 h-5 mr-2" />
        {intl.sidebar.profile}
      </Link>
    </nav>
  );
}
