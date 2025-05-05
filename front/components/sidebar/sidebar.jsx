"use client";

import { useState } from "react";
import SidebarLogo from "./siebarLogo";
import {
  Menu,
  HomeIcon as House,
  LibraryBig,
  ChevronDown,
  ChevronUp,
  BookHeart,
  Settings2,
  CircleHelp,
  Languages,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useClientDictionary } from "@/lib/i18n/clientDictionary";

export default function Sidebar() {
  // Lang options
  const params = useParams();
  const currentLang = params.lang || "es";
  const pathname = usePathname();

  const router = useRouter();

  const handleLanguageSwitch = () => {
    const segments = pathname.split("/");
    const currentLang = segments[1];
    const newLang = currentLang === "es" ? "en" : "es";
    segments[1] = newLang;
    const newPath = segments.join("/") || "/";
    router.push(newPath);
  };

  // Loguot options
  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        router.push(`/${currentLang}/login`);
      } else {
        console.error("Error al cerrar sesión:", await res.text());
      }
    } catch (err) {
      console.error("Error de red:", err);
    }
  };

  // State for sidebar
  const [open, setOpen] = useState(false);

  // Check current routes
  const isHome = pathname === `/${currentLang}`;
  const isManga = pathname.startsWith(`/${currentLang}/manga`);
  const isBooks = pathname.startsWith(`/${currentLang}/books`);
  const isFavorites = pathname.startsWith(`/${currentLang}/favorites`);
  const isLibrary = isManga || isBooks;
  const isSettings = pathname.startsWith(`/${currentLang}/settings`);

  // State for library dropdown
  const [openLibraryMenu, setOpenLibraryMenu] = useState(isLibrary);

  // Get translations
  const { intl, loading } = useClientDictionary(currentLang);

  // Fallback content while loading
  if (loading || !intl) {
    return (
      <>
        <aside className="hidden md:flex md:w-2/12 bg-blackamber flex-col justify-between p-4">
          <div className="p-4">Cargando...</div>
        </aside>
        <button
          className="md:hidden absolute top-4 left-4 z-40 bg-onix p-2 rounded"
          aria-label="Abrir menú"
        >
          <Menu className="w-7 h-7" />
        </button>
      </>
    );
  }

  // Fallback for missing translations
  const sidebar = intl.sidebar || {
    home: "Inicio",
    library: "Biblioteca",
    manga: "Manga",
    books: "Libros",
    favorites: "Favoritos",
  };

  // Hover options
  const hoverBorder = isManga
    ? "hover:border-lilah"
    : isBooks
    ? "hover:border-ash"
    : "hover:border-pearl";

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-2/12 bg-blackamber flex-col justify-between p-4">
        <div>
          <h1 className="hidden">Bunko Shelf</h1>
          <SidebarLogo />
        </div>
        <nav className="mt-8 space-y-2 flex-1 text-lg">
          {/* HOME */}
          <Link
            href={`/${currentLang}`}
            className={`flex items-center p-4 rounded-lg leading-none border ${
              isHome
                ? "border-sand bg-onix"
                : `border-blackamber hover:bg-onix ${hoverBorder}`
            } transition-all duration-300`}
          >
            <House className="w-5 h-5 mr-2" />
            {sidebar.home}
          </Link>
          {/* LIBRARY (DROP DOWN */}
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
                {sidebar.library}
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
                  {sidebar.manga}
                </Link>
                <Link
                  href={`/${currentLang}/books`}
                  className={`block pl-12 pr-4 py-4 rounded-lg leading-none transition-all duration-300 ${
                    isBooks ? "bg-onix text-ash" : "hover:bg-onix"
                  }`}
                >
                  {sidebar.books}
                </Link>
              </div>
            )}
          </div>
          {/* OTHER OPTIONS */}
          <Link
            href={`/${currentLang}/favorites`}
            className={`flex items-center p-4 rounded-lg leading-none border ${
              isFavorites
                ? "border-sand bg-onix"
                : `border-blackamber hover:bg-onix ${hoverBorder}`
            } transition-all duration-300`}
          >
            <BookHeart className="w-5 h-5 mr-2" />
            {sidebar.favorites}
          </Link>
          <Link
            href={`/${currentLang}/settings`}
            className={`flex items-center p-4 rounded-lg leading-none border ${
              isSettings
                ? "border-sand bg-onix"
                : `border-blackamber hover:bg-onix ${hoverBorder}`
            } transition-all duration-300`}
          >
            <Settings2 className="w-5 h-5 mr-2" />
            {sidebar.settings}
          </Link>
        </nav>
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
              onClick={handleLanguageSwitch}
            >
              <Languages className="w-5 h-5" />
            </button>

            {/* Help */}
            <Link
              href="#"
              target="_blank"
              rel="noopener"
              className={`border border-onix rounded-lg p-2 hover:text-pearl hover:bg-onix transition-all duration-300 ${hoverBorder}`}
            >
              <CircleHelp className="w-5 h-5" />
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
      </aside>

      {/* MOBILE SIDEBAR */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black md:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 w-3/4 h-full bg-blackamber flex flex-col justify-between p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 className="hidden">Bunko Shelf</h2>
              <SidebarLogo />
            </div>
            <nav className="mt-8 space-y-2 flex-1 text-lg">
              {/* HOME */}
              <Link
                href={`/${currentLang}`}
                className={`flex items-center p-4 rounded-lg leading-none border ${
                  isHome
                    ? "border-sand bg-onix"
                    : `border-blackamber hover:bg-onix ${hoverBorder}`
                }`}
              >
                <House className="w-5 h-5 mr-2" />
                {sidebar.home}
              </Link>
              {/* LIBRARY (DROP DOWN */}
              <div className="relative">
                <button
                  onClick={() => setOpenLibraryMenu(!openLibraryMenu)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg leading-none cursor-pointer border ${
                    isLibrary
                      ? isManga
                        ? "border-lilah bg-onix"
                        : "border-ash bg-onix"
                      : "border-blackamber hover:border-pearl hover:bg-onix"
                  }`}
                >
                  <span className="flex items-center">
                    <LibraryBig className="w-5 h-5 mr-2" />
                    {sidebar.library}
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
                      className={`block pl-12 pr-4 py-4 rounded-lg leading-none ${
                        isManga ? "bg-onix text-lilah" : "hover:bg-onix"
                      }`}
                    >
                      {sidebar.manga}
                    </Link>
                    <Link
                      href={`/${currentLang}/books`}
                      className={`block pl-12 pr-4 py-4 rounded-lg leading-none ${
                        isBooks ? "bg-onix text-ash" : "hover:bg-onix"
                      }`}
                    >
                      {sidebar.books}
                    </Link>
                  </div>
                )}
              </div>
              {/* OTHER OPTIONS */}
              <Link
                href={`/${currentLang}/favorites`}
                className={`flex items-center p-4 rounded-lg leading-none border ${
                  isFavorites
                    ? "border-sand bg-onix"
                    : `border-blackamber hover:bg-onix ${hoverBorder}`
                }`}
              >
                <BookHeart className="w-5 h-5 mr-2" />
                {sidebar.favorites}
              </Link>
              <Link
                href={`/${currentLang}/settings`}
                className={`flex items-center p-4 rounded-lg leading-none border ${
                  isSettings
                    ? "border-sand bg-onix"
                    : `border-blackamber hover:bg-onix ${hoverBorder}`
                }`}
              >
                <Settings2 className="w-5 h-5 mr-2" />
                {sidebar.settings}
              </Link>
            </nav>
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
                <div className="flex items-center gap-2">
                  {/* Language Switcher */}
                  <button
                    className="border border-onix rounded-lg p-2 cursor-pointer"
                    aria-label="Switch Language"
                    onClick={handleLanguageSwitch}
                  >
                    <Languages className="w-5 h-5" />
                  </button>

                  {/* Help */}
                  <Link
                    href="#"
                    target="_blank"
                    rel="noopener"
                    className="border border-onix rounded-lg p-2"
                  >
                    <CircleHelp className="w-5 h-5" />
                  </Link>

                  {/* Logout Button */}
                  <button
                    className="border border-onix rounded-lg p-2 cursor-pointer"
                    aria-label="Logout"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Botón hamburguesa */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden absolute top-4 left-4 z-40 bg-onix p-2 rounded"
        aria-label="Abrir menú"
      >
        <Menu className="w-7 h-7" />
      </button>
    </>
  );
}
