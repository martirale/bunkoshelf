"use client";

import { useEffect, useState } from "react";
import { useSearchModal } from "@/hooks/useSearchModal";
import Link from "next/link";
import { searchManga } from "@/actions/search";
import type { Locale, Dictionary, SearchResult } from "@/lib/types";
import {
  SearchIcon,
  UserRoundPenIcon,
  LibraryBigIcon,
  BookIcon,
  BookCopyIcon,
  DramaIcon,
  TagsIcon,
} from "lucide-react";

interface SearchModalProps {
  lang: Locale;
  intl: Dictionary;
}

export default function SearchModal({ lang, intl }: SearchModalProps) {
  const { open, setOpen } = useSearchModal();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  function getGenresAndTagsForSeries(seriesSlug: string) {
    const relatedVolumes = results.filter(
      (r) => r.type === "volume" && r.series && r.series === seriesSlug
    );

    const genresSet = new Set<string>();
    const tagsSet = new Set<string>();

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
    const handleKeyDown = (e: KeyboardEvent) => {
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

    const performSearch = async () => {
      try {
        const result = await searchManga({ query });
        if ("data" in result && result.data) {
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

  if (!open) return null;

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
          <SearchIcon size={20} className="absolute left-4 top-4" />

          <input
            type="search"
            autoFocus
            placeholder={intl.search.titleAuthor as string}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-onix rounded-lg focus:outline-none"
          />
        </div>

        {loading && (
          <p className="text-base mt-4 text-center">{intl.search.searching as string}</p>
        )}

        {!loading && filteredResults.length === 0 && query.trim() && (
          <p className="text-base mt-4 text-center">{intl.search.noResults as string}</p>
        )}

        <ul className="max-h-96 overflow-y-auto space-y-4">
          {filteredResults.map((res) => {
            const isSeries = res.type === "series";
            const href = isSeries
              ? `/${lang}/manga/${res.slug}`
              : `/${lang}/manga/volume/${res.slug}`;

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
                  setOpen(false);
                  setQuery("");
                }}
                className="mt-4"
              >
                <Link href={href}>
                  <div className="bg-sand rounded-lg px-4 py-2 cursor-pointer">
                    <p className="font-bold truncate">
                      {res.type === "series"
                        ? res.series || res.title
                        : res.title}
                    </p>

                    {isSeries ? (
                      <>
                        <p className="text-base truncate">
                          <span className="flex items-center">
                            <UserRoundPenIcon size={16} className="mr-1" />
                            {res.writer || "Desconocido"}
                          </span>
                        </p>
                        <p className="text-base truncate">
                          <span className="flex items-center">
                            <LibraryBigIcon size={16} className="mr-1" />
                            {intl.search.series as string}
                          </span>
                          <span className="flex items-center capitalize">
                            {genres && (
                              <>
                                <DramaIcon size={16} className="mr-1" />
                                {genres}
                              </>
                            )}
                            {tags && (
                              <>
                                <TagsIcon size={16} className="mr-1 ml-2" />
                                {tags}
                              </>
                            )}
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-base truncate">
                          <span className="flex items-center">
                            <UserRoundPenIcon size={16} className="mr-1" />
                            {res.writer || "Desconocido"}
                          </span>
                        </p>
                        {res.isOneshot ? (
                          <p className="text-base truncate">
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
                              {tags && (
                                <>
                                  <TagsIcon size={16} className="mr-1 ml-2" />
                                  {tags}
                                </>
                              )}
                            </span>
                          </p>
                        ) : (
                          <p className="text-base truncate">
                            <span className="flex items-center">
                              <BookCopyIcon size={16} className="mr-1" />
                              {intl.search.volume as string}
                            </span>
                            <span className="flex items-center capitalize">
                              {genres && (
                                <>
                                  <DramaIcon size={16} className="mr-1" />
                                  {genres}
                                </>
                              )}
                              {tags && (
                                <>
                                  <TagsIcon size={16} className="mr-1 ml-2" />
                                  {tags}
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
    </div>
  );
}
