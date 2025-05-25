"use client";

import { useEffect, useState } from "react";
import { useSearchModal } from "@/hooks/useSearchModal";
import { Search } from "lucide-react";
import Link from "next/link";

export default function SearchModal({ lang, intl }) {
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
        setQuery("");
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
        if (err.title !== "AbortError") {
          console.error(err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [query]);

  if (!open) return null;

  // Aquí filtro para no mostrar series que son oneshot
  const filteredResults = results.filter(
    (res) => !(res.type === "series" && res.isOneshot === true)
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-24 px-4"
      onClick={() => {
        setOpen(false);
        setQuery("");
      }}
    >
      <div
        className="bg-pearl text-onix p-4 rounded-lg w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Search className="absolute left-4 top-4 w-5 h-5" />

          <input
            type="search"
            autoFocus
            placeholder={intl.search.titleAuthor}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-onix rounded-lg focus:outline-none"
          />
        </div>

        {loading && (
          <p className="text-base mt-4 text-center">{intl.search.searching}</p>
        )}

        {!loading && filteredResults.length === 0 && query.trim() && (
          <p className="text-base mt-4 text-center">{intl.search.noResults}</p>
        )}

        <ul className="max-h-96 overflow-y-auto space-y-4">
          {filteredResults.map((res) => {
            const isSeries = res.type === "series";
            const href = isSeries
              ? `/${lang}/manga/${res.slug}`
              : `/${lang}/manga/volume/${res.slug}`;

            return (
              <li
                key={res.id}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="mt-4"
              >
                <Link href={href}>
                  <div className="bg-sand rounded-lg px-4 py-2 cursor-pointer">
                    <p className="font-bold truncate">{res.title}</p>

                    {isSeries ? (
                      <>
                        <p className="text-base truncate">
                          {intl.search.author}: {res.writer || "Desconocido"}
                        </p>
                        <p className="text-base truncate">
                          {intl.search.series}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-base truncate">
                          {intl.search.author}: {res.writer || "Desconocido"}
                        </p>
                        {res.isOneshot ? (
                          <p className="text-base truncate">Oneshot</p>
                        ) : (
                          <p className="text-base truncate">
                            {intl.search.series}: {res.series}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
