"use client";
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
          <a href="#" className="block hover:text-sand">
            Inicio
          </a>
          <a href="#" className="block hover:text-sand">
            Biblioteca
          </a>
          <a href="#" className="block hover:text-sand">
            Favoritos
          </a>
        </nav>
        <div>
          <p className="text-sm">itsmrtr</p>
        </div>
      </aside>

      {/* Sidebar para móvil */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
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
              <a href="#" className="block hover:text-sand">
                Inicio
              </a>
              <a href="#" className="block hover:text-sand">
                Biblioteca
              </a>
              <a href="#" className="block hover:text-sand">
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
        className="md:hidden absolute top-4 left-4 z-50 bg-onix p-2 rounded"
        aria-label="Abrir menú"
      >
        &#9776;
      </button>
    </>
  );
}
