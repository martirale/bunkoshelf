"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Search({ lang, intl }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="w-full max-w-xs">
      <input
        type="search"
        placeholder="Buscar título o autor"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-3 mt-8 rounded-lg bg-onix focus:outline-none"
      />

      {loading && (
        <p className="text-sm text-gray-500 mt-2 text-center">Buscando...</p>
      )}

      {!loading && results.length === 0 && query.trim() && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          No se encontraron resultados.
        </p>
      )}

      <ul className="max-h-48 overflow-y-auto space-y-1">
        {results.map(({ id, title, writer, slug }) => (
          <li
            key={id}
            className="text-sm border-b border-gray-200 pb-1"
            onClick={() => setQuery("")}
          >
            <Link href={`/${lang}/manga/volume/${slug}`}>
              <div className="font-semibold truncate">{title}</div>
              <div className="text-gray-600 truncate">
                Autor: {writer || "Desconocido"}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
