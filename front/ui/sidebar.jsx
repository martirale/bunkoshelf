"use client";
import { House } from "lucide-react";
import { BookHeart } from "lucide-react";
import { Menu } from "lucide-react";
import { LibraryBig } from "lucide-react";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Sidebar para escritorio */}
      <aside className="hidden md:flex md:w-2/12 bg-blackamber flex-col justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold">Bunko Shelf</h1>
        </div>
        <nav className="mt-6 space-y-4 flex-1 text-lg">
          <a
            href="/"
            className="flex items-center px-4 py-3 border border-blackamber hover:border-lilah hover:bg-onix rounded-lg leading-none"
          >
            <House className="w-5 h-5 mr-2" />
            Inicio
          </a>
          <a
            href="#"
            className="flex items-center px-4 py-3 border border-blackamber hover:border-lilah hover:bg-onix rounded-lg leading-none"
          >
            <LibraryBig className="w-5 h-5 mr-2" />
            Biblioteca
          </a>
          <a
            href="#"
            className="flex items-center px-4 py-3 border border-blackamber hover:border-lilah hover:bg-onix rounded-lg leading-none"
          >
            <BookHeart className="w-5 h-5 mr-2" />
            Favoritos
          </a>
        </nav>
        <div className="flex justify-between items-center px-2">
          <p className="text-sm">v0.1.0</p>

          {/* Logout Button */}
          <button
            className="border border-blackamber hover:border-lilah hover:text-pearl hover:bg-onix rounded-lg p-2 cursor-pointer"
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

      {/* Sidebar para móvil */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black md:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 w-3/4 h-full bg-onix flex flex-col justify-between p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h1 className="text-2xl font-bold">Bunko Shelf</h1>
            </div>
            <nav className="mt-6 space-y-4 flex-1 text-lg">
              <a
                href="/"
                className="flex items-center px-4 py-3 border border-onix hover:border-lilah hover:bg-onix rounded-lg leading-none"
              >
                <House className="w-5 h-5 mr-2" />
                Inicio
              </a>
              <a
                href="#"
                className="flex items-center px-4 py-3 border border-onix hover:border-lilah hover:bg-onix rounded-lg leading-none"
              >
                <LibraryBig className="w-5 h-5 mr-2" />
                Biblioteca
              </a>
              <a
                href="#"
                className="flex items-center px-4 py-3 border border-onix hover:border-lilah hover:bg-onix rounded-lg leading-none"
              >
                <BookHeart className="w-5 h-5 mr-2" />
                Favoritos
              </a>
            </nav>
            <div className="flex justify-between items-center pl-4">
              <p className="text-sm">v0.1.0</p>

              {/* Logout Button */}
              <button
                className="border border-onix hover:border-lilah hover:text-pearl hover:bg-onix rounded-lg p-2 cursor-pointer"
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
