"use client";

import SidebarLogo from "./siebarLogo";
import {
  Menu,
  House,
  LibraryBig,
  ChevronDown,
  ChevronUp,
  BookHeart,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();
  const isHome = pathname === "/es" || pathname === "/en";
  const isMangas =
    pathname.startsWith("/es/mangas") || pathname.startsWith("/en/mangas");
  const isBooks =
    pathname.startsWith("/es/books") || pathname.startsWith("/en/books");
  const isFavorites =
    pathname.startsWith("/es/favorites") ||
    pathname.startsWith("/en/favorites");
  const isLibrary = isMangas || isBooks;

  const [openLibraryMenu, setOpenLibraryMenu] = useState(isLibrary);
  const shouldShowLibraryMenu = openLibraryMenu || isLibrary;

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
            href="/"
            className={`flex items-center p-4 rounded-lg leading-none border ${
              isHome
                ? "border-lilah bg-onix"
                : "border-blackamber hover:border-pearl hover:bg-onix"
            } transition-all duration-300`}
          >
            <House className="w-5 h-5 mr-2" />
            Inicio
          </Link>
          {/* LIBRARY (DROP DOWN */}
          <div className="relative">
            <button
              onClick={() => setOpenLibraryMenu(!openLibraryMenu)}
              className={`w-full flex items-center justify-between p-4 rounded-lg leading-none cursor-pointer border ${
                isLibrary
                  ? isMangas
                    ? "border-lilah bg-onix"
                    : "border-ash bg-onix"
                  : "border-blackamber hover:border-pearl hover:bg-onix"
              } transition-all duration-300`}
            >
              <span className="flex items-center">
                <LibraryBig className="w-5 h-5 mr-2" />
                Biblioteca
              </span>
              {shouldShowLibraryMenu ? (
                <ChevronUp className="w-5 h-5 ml-2" />
              ) : (
                <ChevronDown className="w-5 h-5 ml-2" />
              )}
            </button>

            {openLibraryMenu && (
              <div className="mt-2 space-y-2">
                <Link
                  href="/mangas"
                  className={`block pl-12 pr-4 py-4 rounded-lg leading-none transition-all duration-300 ${
                    isMangas
                      ? "bg-onix text-lilah"
                      : "border-blackamber hover:border-pearl hover:bg-onix"
                  }`}
                >
                  Mangas
                </Link>
                <Link
                  href="/books"
                  className={`block pl-12 pr-4 py-4 rounded-lg leading-none transition-all duration-300 ${
                    isBooks
                      ? "bg-onix text-ash"
                      : "border-blackamber hover:border-pearl hover:bg-onix"
                  }`}
                >
                  Libros
                </Link>
              </div>
            )}
          </div>
          {/* OTHER OPTIONS */}
          <a
            href="/favorites"
            className={`flex items-center p-4 rounded-lg leading-none border ${
              isFavorites
                ? "border-lilah bg-onix"
                : "border-blackamber hover:border-pearl hover:bg-onix"
            } transition-all duration-300`}
          >
            <BookHeart className="w-5 h-5 mr-2" />
            Favoritos
          </a>
        </nav>
        <div className="flex justify-between items-center px-2">
          <p className="text-sm">v0.1.0</p>

          {/* Logout Button */}
          <button
            className="border border-onix hover:border-lilah hover:text-pearl hover:bg-onix rounded-lg p-2 cursor-pointer transition-all duration-300"
            aria-label="Logout"
            onClick={() => {
              // AQUÍ LÓGICA CIERRE SESIÓN
              console.log("Logged out");
            }}
          >
            <LogOut className="w-5 h-5" />
          </button>
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
                href="/"
                className={`flex items-center p-4 rounded-lg leading-none border ${
                  isHome
                    ? "border-lilah bg-onix"
                    : "border-blackamber hover:border-pearl hover:bg-onix"
                }`}
              >
                <House className="w-5 h-5 mr-2" />
                Inicio
              </Link>
              {/* LIBRARY (DROP DOWN */}
              <div className="relative">
                <button
                  onClick={() => setOpenLibraryMenu(!openLibraryMenu)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg leading-none cursor-pointer border ${
                    isLibrary
                      ? isMangas
                        ? "border-lilah bg-onix"
                        : "border-ash bg-onix"
                      : "border-blackamber hover:border-pearl hover:bg-onix"
                  }`}
                >
                  <span className="flex items-center">
                    <LibraryBig className="w-5 h-5 mr-2" />
                    Biblioteca
                  </span>
                  {shouldShowLibraryMenu ? (
                    <ChevronUp className="w-5 h-5 ml-2" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-2" />
                  )}
                </button>

                {openLibraryMenu && (
                  <div className="mt-2 space-y-2">
                    <Link
                      href="/mangas"
                      className={`block pl-12 pr-4 py-4 rounded-lg leading-none ${
                        isMangas
                          ? "bg-onix text-lilah"
                          : "border-blackamber hover:border-pearl hover:bg-onix"
                      }`}
                    >
                      Mangas
                    </Link>
                    <Link
                      href="/books"
                      className={`block pl-12 pr-4 py-4 rounded-lg leading-none ${
                        isBooks
                          ? "bg-onix text-ash"
                          : "border-blackamber hover:border-pearl hover:bg-onix"
                      }`}
                    >
                      Libros
                    </Link>
                  </div>
                )}
              </div>
              {/* OTHER OPTIONS */}
              <Link
                href="/favorites"
                className={`flex items-center p-4 rounded-lg leading-none border ${
                  isFavorites
                    ? "border-lilah bg-onix"
                    : "border-blackamber hover:border-pearl hover:bg-onix"
                }`}
              >
                <BookHeart className="w-5 h-5 mr-2" />
                Favoritos
              </Link>
            </nav>
            <div className="flex justify-between items-center pl-4">
              <p className="text-sm">v0.1.0</p>

              {/* Logout Button */}
              <button
                className="border border-onix rounded-lg p-2 cursor-pointer"
                aria-label="Logout"
                onClick={() => {
                  // AQUÍ LÓGICA CIERRE SESIÓN
                  console.log("Logged out");
                }}
              >
                <LogOut className="w-5 h-5" />
              </button>
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
