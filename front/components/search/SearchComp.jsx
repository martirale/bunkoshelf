"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function SearchComp({ lang, intl }) {
  const router = useRouter();

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

  // Aquí filtro para no mostrar series que son oneshot
  const filteredResults = results.filter(
    (res) => !(res.type === "series" && res.isOneshot === true)
  );

  return (
    <>
      <div className="rounded-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <ChevronLeft
            className="absolute left-4 top-3 w-7 h-7"
            onClick={() => router.back()}
          />

          <input
            type="search"
            autoFocus
            placeholder={intl.search.titleAuthor}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-blackamber border border-pearl rounded-lg focus:outline-none"
          />
        </div>

        {loading && (
          <p className="text-base mt-4 text-center">{intl.search.searching}</p>
        )}

        {!loading && filteredResults.length === 0 && query.trim() && (
          <p className="text-base mt-4 text-center">{intl.search.noResults}</p>
        )}

        <ul className="overflow-y-auto space-y-4">
          {filteredResults.map((res) => {
            const isSeries = res.type === "series";
            const href = isSeries
              ? `/${lang}/manga/${res.slug}`
              : `/${lang}/manga/volume/${res.slug}`;

            return (
              <li
                key={res.id}
                onClick={() => {
                  setQuery("");
                }}
                className="mt-4"
              >
                <Link href={href}>
                  <div className="bg-blackamber rounded-lg px-4 py-2 cursor-pointer">
                    <p className="font-bold truncate">
                      {res.type === "series"
                        ? res.series || res.title
                        : res.title}
                    </p>

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
                            {intl.search.volume}
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
    </>
  );
}
