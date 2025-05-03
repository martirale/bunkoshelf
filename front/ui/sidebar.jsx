"use client";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Sidebar para escritorio */}
      <aside className="hidden md:flex md:w-2/12 bg-onix flex-col justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold">Bunko Shelf</h1>
        </div>
        <nav className="mt-6 space-y-4 flex-1">
          <a href="#" className="block hover:text-pearl">
            Inicio
          </a>
          <a href="#" className="block hover:text-pearl">
            Biblioteca
          </a>
          <a href="#" className="block hover:text-pearl">
            Favoritos
          </a>
        </nav>
        <div className="flex justify-between items-center">
          <p className="text-sm">v0.1.0</p>

          {/* Logout Button */}
          <button
            className="hover:text-pearl"
            aria-label="Logout"
            onClick={() => {
              // AQUÍ LÓGICA CIERRE SESIÓN
              console.log("Logged out");
            }}
          >
            <LogOut className="w-5 h05" />
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
            <nav className="mt-6 space-y-4 flex-1">
              <a href="#" className="block hover:text-pearl">
                Inicio
              </a>
              <a href="#" className="block hover:text-pearl">
                Biblioteca
              </a>
              <a href="#" className="block hover:text-pearl">
                Favoritos
              </a>
            </nav>
            <div>
              <p className="text-sm">itsmrtr</p>
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
        &#9776;
      </button>
    </>
  );
}
