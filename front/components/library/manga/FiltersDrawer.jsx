"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Accordion from "@/components/ui/Accordion";
import clsx from "clsx";

export default function FiltersDrawer({ intl }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    const genreParam = searchParams.get("genre");
    const tagParam = searchParams.get("tag");

    setSelectedGenres(genreParam ? genreParam.split(",") : []);
    setSelectedTags(tagParam ? tagParam.split(",") : []);
  }, [searchParams]);

  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch("/api/library/filters/manga");
        if (!res.ok) throw new Error("Error fetching filters");
        const data = await res.json();
        setGenres(data.genres);
        setTags(data.tags);
      } catch (e) {
        console.error(e);
      }
    }
    fetchFilters();
  }, []);

  function toggleGenre(genreName) {
    setSelectedGenres((prev) =>
      prev.includes(genreName)
        ? prev.filter((g) => g !== genreName)
        : [...prev, genreName]
    );
  }

  function toggleTag(tagName) {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  }

  function applyFilters() {
    const params = new URLSearchParams();

    if (selectedGenres.length) params.set("genre", selectedGenres.join(","));
    if (selectedTags.length) params.set("tag", selectedTags.join(","));
    params.set("page", "1");

    router.push(`?${params.toString()}`);
    setIsOpen(false);
  }

  function clearFilters() {
    setSelectedGenres([]);
    setSelectedTags([]);
    router.push(`?page=1`);
    setIsOpen(false);
  }

  const totalFilters = selectedGenres.length + selectedTags.length;
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
            {intl.filters.filtering} (x{totalFilters})
          </span>
        ) : (
          <span className="uppercase">{intl.filters.filter}</span>
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
          <h2>{intl.filters.filters}</h2>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar filtros"
            className="hover:text-lilah cursor-pointer transition-all duration-300"
          >
            <ChevronRight className="w-7 h-7 -mr-1" />
          </button>
        </header>

        <div className="p-4 flex flex-col gap-4 flex-grow overflow-hidden">
          {/* Acordeón de géneros */}
          <Accordion title={intl.filters.genres}>
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

          {/* Acordeón de etiquetas */}
          <Accordion title={intl.filters.tags}>
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
            {intl.filters.clean}
          </button>
          <button
            onClick={applyFilters}
            className="px-2 py-3 w-full bg-pearl text-onix leading-none rounded-lg hover:bg-lilah hover:text-pearl cursor-pointer transition-all duration-300"
          >
            {intl.filters.apply}
          </button>
        </footer>
      </aside>
    </>
  );
}
