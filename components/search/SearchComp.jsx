"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { searchManga } from "@/actions/search";
import {
  ChevronLeftIcon,
  UserRoundPenIcon,
  LibraryBigIcon,
  BookIcon,
  BookCopyIcon,
  DramaIcon,
  TagsIcon,
} from "lucide-react";

export default function SearchComp({ lang, intl }) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Función para juntar géneros o tags de volúmenes que pertenezcan a la serie
  function getGenresAndTagsForSeries(seriesSlug) {
    // Filtra volúmenes que tengan series igual a esta serieSlug
    const relatedVolumes = results.filter(
      (r) => r.type === "volume" && r.series && r.series === seriesSlug
    );

    // Extraer géneros y etiquetas únicos
    const genresSet = new Set();
    const tagsSet = new Set();

    relatedVolumes.forEach((vol) => {
      if (vol.genres) {
        vol.genres
          .split(",")
          .map((g) => g.trim())
          .forEach((g) => g && genresSet.add(g));
      }
      if (vol.tags) {
        vol.tags
          .split(",")
          .map((t) => t.trim())
          .forEach((t) => t && tagsSet.add(t));
      }
    });

    return {
      genres: Array.from(genresSet).join(", "),
      tags: Array.from(tagsSet).join(", "),
    };
  }

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const performSearch = async () => {
      try {
        const result = await searchManga({ query });
        if (result.data) {
          setResults(result.data);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    performSearch();

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
          <ChevronLeftIcon
            size={28}
            className="absolute left-4 top-3"
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

            // Obtener géneros y tags para series (porque no vienen directos)
            let genres = res.genres || "";
            let tags = res.tags || "";

            if (isSeries) {
              const combined = getGenresAndTagsForSeries(
                res.series || res.slug
              );
              genres = combined.genres;
              tags = combined.tags;
            }

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
                          {/* Series Author */}
                          <span className="flex items-center">
                            <UserRoundPenIcon size={16} className="mr-1" />
                            {res.writer || "Desconocido"}
                          </span>
                        </p>
                        <p className="text-base truncate">
                          {/* Series Type */}
                          <span className="flex items-center">
                            <LibraryBigIcon size={16} className="mr-1" />
                            {intl.search.series}
                          </span>
                          <span className="flex items-center capitalize">
                            {genres && (
                              <>
                                <DramaIcon size={16} className="mr-1" />
                                {genres}
                              </>
                            )}
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-base truncate">
                          {/* Volumes Author */}
                          <span className="flex items-center">
                            <UserRoundPenIcon size={16} className="mr-1" />
                            {res.writer || "Desconocido"}
                          </span>
                        </p>
                        {res.isOneshot ? (
                          <p className="text-base truncate">
                            {/* Oneshot Type */}
                            <span className="flex items-center">
                              <BookIcon size={16} className="mr-1" />
                              Oneshot
                            </span>
                            <span className="flex items-center capitalize">
                              {genres && (
                                <>
                                  <DramaIcon size={16} className="mr-1" />
                                  {genres}
                                </>
                              )}
                            </span>
                          </p>
                        ) : (
                          <p className="text-base truncate">
                            {/* Volumes Type */}
                            <span className="flex items-center">
                              <BookCopyIcon size={16} className="mr-1" />
                              {intl.search.volume}
                            </span>
                            <span className="flex items-center capitalize">
                              {genres && (
                                <>
                                  <DramaIcon size={16} className="mr-1" />
                                  {genres}
                                </>
                              )}
                            </span>
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
