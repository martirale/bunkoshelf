"use client";

import { useEffect, useState } from "react";
import { useSearchModal } from "@/hooks/useSearchModal";
import { Search } from "lucide-react";
import Link from "next/link";

export default function SearchModal({ lang = "es", intl }) {
  const { open, setOpen } = useSearchModal();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error(err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-24 px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-neutral-900 w-full max-w-lg rounded-lg shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="search"
            autoFocus
            placeholder="Buscar título o autor"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md bg-onix text-white focus:outline-none"
          />
        </div>

        {loading && (
          <p className="text-sm text-gray-500 mt-2 text-center">Buscando...</p>
        )}

        {!loading && results.length === 0 && query.trim() && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            No se encontraron resultados.
          </p>
        )}

        <ul className="mt-4 max-h-48 overflow-y-auto space-y-1">
          {results.map(({ id, title, writer, slug }) => (
            <li
              key={id}
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
            >
              <Link href={`/${lang}/manga/volume/${slug}`}>
                <div className="font-semibold truncate text-white">{title}</div>
                <div className="text-gray-400 text-sm truncate">
                  Autor: {writer || "Desconocido"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
