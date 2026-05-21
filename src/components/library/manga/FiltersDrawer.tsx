"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import Accordion from "@/components/ui/Accordion";
import clsx from "clsx";
import { getLibraryFilters } from "@/actions/library";
import type { LibraryScope } from "@/lib/librarySection";
import type { DictionarySection } from "@/lib/types";

interface FilterItem {
  id: string;
  name: string;
}

const UNKNOWN_AUTHOR_ID = "__unknown__";

function splitFilterParam(value: string | null) {
  if (!value) return [];

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

interface FiltersDrawerProps {
  intl: DictionarySection;
  scope?: LibraryScope;
}

export default function FiltersDrawer({
  intl,
  scope = "all",
}: FiltersDrawerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [authors, setAuthors] = useState<FilterItem[]>([]);
  const [genres, setGenres] = useState<FilterItem[]>([]);
  const [tags, setTags] = useState<FilterItem[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filters = intl.filters as DictionarySection;
  const catalog = intl.catalog as DictionarySection | undefined;
  const unknownAuthorLabel =
    (catalog?.unknownAuthor as string | undefined) || "Unknown";

  useEffect(() => {
    const authorParam = searchParams.get("author");
    const genreParam = searchParams.get("genre");
    const tagParam = searchParams.get("tag");

    setSelectedAuthors(splitFilterParam(authorParam));
    setSelectedGenres(splitFilterParam(genreParam));
    setSelectedTags(splitFilterParam(tagParam));
  }, [searchParams]);

  useEffect(() => {
    async function fetchFilters() {
      try {
        const data = await getLibraryFilters({ scope });
        if (!data || "error" in data) throw new Error("Error fetching filters");
        setAuthors(data.authors);
        setGenres(data.genres);
        setTags(data.tags);
      } catch (e) {
        console.error(e);
      }
    }
    fetchFilters();
  }, [scope]);

  function toggleGenre(genreName: string) {
    setSelectedGenres((prev) =>
      prev.includes(genreName)
        ? prev.filter((g) => g !== genreName)
        : [...prev, genreName]
    );
  }

  function toggleAuthor(authorName: string) {
    setSelectedAuthors((prev) =>
      prev.includes(authorName)
        ? prev.filter((author) => author !== authorName)
        : [...prev, authorName]
    );
  }

  function toggleTag(tagName: string) {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  }

  function applyFilters() {
    const params = new URLSearchParams();

    if (selectedAuthors.length) params.set("author", selectedAuthors.join(","));
    if (selectedGenres.length) params.set("genre", selectedGenres.join(","));
    if (selectedTags.length) params.set("tag", selectedTags.join(","));
    params.set("page", "1");

    router.push(`?${params.toString()}`);
    setIsOpen(false);
  }

  function clearFilters() {
    setSelectedAuthors([]);
    setSelectedGenres([]);
    setSelectedTags([]);
    router.push(`?page=1`);
    setIsOpen(false);
  }

  const totalFilters =
    selectedAuthors.length + selectedGenres.length + selectedTags.length;
  const isFiltering = totalFilters > 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          "text-sm px-3 py-1 rounded-md cursor-pointer transition-all duration-300",
          isFiltering
            ? "bg-lilah text-pearl"
            : "bg-pearl text-onix hover:bg-lilah hover:text-pearl"
        )}
        aria-label="Abrir filtros"
      >
        {isFiltering ? (
          <span className="uppercase">
            {filters.filtering as string} (x{totalFilters})
          </span>
        ) : (
          <span className="uppercase">{filters.filter as string}</span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-80 2xl:w-90 bg-onix z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
        aria-label="Panel de filtros"
      >
        <header className="p-4 flex justify-between items-center">
          <h2>{filters.filters as string}</h2>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar filtros"
            className="hover:text-lilah cursor-pointer transition-all duration-300"
          >
            <ChevronRightIcon size={28} className="-mr-1" />
          </button>
        </header>

        <div className="p-4 flex flex-col gap-4 flex-grow overflow-hidden">
          <Accordion title={filters.authors as string}>
            <ul className="space-y-1 max-h-44 md:max-h-64 overflow-auto pr-2">
              {authors.map((author) => (
                <li key={author.id}>
                  <label className="inline-flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAuthors.includes(author.name)}
                      onChange={() => toggleAuthor(author.name)}
                    />
                    <span className="capitalize">
                      {author.name === UNKNOWN_AUTHOR_ID
                        ? unknownAuthorLabel
                        : author.name}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </Accordion>

          <Accordion title={filters.genres as string}>
            <ul className="space-y-1 max-h-44 md:max-h-64 overflow-auto pr-2">
              {genres.map((genre) => (
                <li key={genre.name}>
                  <label className="inline-flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(genre.name)}
                      onChange={() => toggleGenre(genre.name)}
                    />
                    <span className="capitalize">{genre.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Accordion>

          <Accordion title={filters.tags as string}>
            <ul className="space-y-1 max-h-44 md:max-h-64 overflow-auto pr-2">
              {tags.map((tag) => (
                <li key={tag.name}>
                  <label className="inline-flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.name)}
                      onChange={() => toggleTag(tag.name)}
                    />
                    <span className="capitalize">{tag.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Accordion>
        </div>

        <footer className="p-4 flex justify-between gap-4">
          <button
            onClick={clearFilters}
            className="px-2 py-3 w-full bg-pearl text-onix leading-none rounded-lg hover:bg-lilah hover:text-pearl cursor-pointer transition-all duration-300"
          >
            {filters.clean as string}
          </button>
          <button
            onClick={applyFilters}
            className="px-2 py-3 w-full bg-pearl text-onix leading-none rounded-lg hover:bg-lilah hover:text-pearl cursor-pointer transition-all duration-300"
          >
            {filters.apply as string}
          </button>
        </footer>
      </aside>
    </>
  );
}
