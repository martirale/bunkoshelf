"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import { ChevronRight } from "lucide-react";

export default function FiltersDrawer() {
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

  // Handler checkbox género
  function toggleGenre(genreName) {
    setSelectedGenres((prev) =>
      prev.includes(genreName)
        ? prev.filter((g) => g !== genreName)
        : [...prev, genreName]
    );
  }

  // Handler checkbox tag
  function toggleTag(tagName) {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  }

  // Aplicación de filtros
  function applyFilters() {
    const params = new URLSearchParams();

    if (selectedGenres.length) params.set("genre", selectedGenres.join(","));
    if (selectedTags.length) params.set("tag", selectedTags.join(","));
    params.set("page", "1");

    router.push(`?${params.toString()}`);
    setIsOpen(false);
  }

  // Limpiar filtros
  function clearFilters() {
    setSelectedGenres([]);
    setSelectedTags([]);
    router.push(`?page=1`);
    setIsOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm uppercase bg-pearl text-onix hover:bg-lilah hover:text-pearl px-3 py-1 mr-4 rounded-md cursor-pointer transition-all duration-300"
        aria-label="Abrir filtros"
      >
        Filtrar
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-75 2xl:w-90 bg-onix z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
        aria-label="Panel de filtros"
      >
        <header className="p-4 flex justify-between items-center">
          <h2>Filtros</h2>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar filtros"
            className="hover:text-lilah cursor-pointer transition-all duration-300"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </header>

        <div className="p-4 flex flex-col gap-8 flex-grow overflow-hidden">
          {/* Géneros */}
          <section className="flex-1 overflow-hidden flex flex-col">
            <h3 className="text-base mb-2">Géneros</h3>
            {genres.length === 0 && <p>Cargando géneros...</p>}
            <ul className="space-y-1 overflow-auto flex-grow">
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
          </section>

          {/* Etiquetas */}
          <section className="flex-1 overflow-hidden flex flex-col">
            <h3 className="text-base mb-2">Etiquetas</h3>
            {tags.length === 0 && <p>Cargando etiquetas...</p>}
            <ul className="space-y-1 overflow-auto flex-grow">
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
          </section>
        </div>

        <footer className="p-4 flex justify-between gap-4">
          <button
            onClick={clearFilters}
            className="px-2 py-4 w-full bg-pearl text-onix leading-none rounded-lg hover:bg-lilah hover:text-pearl cursor-pointer transition-all duration-300"
          >
            Limpiar filtros
          </button>
          <button
            onClick={applyFilters}
            className="px-2 py-4 w-full bg-pearl text-onix leading-none rounded-lg hover:bg-lilah hover:text-pearl cursor-pointer transition-all duration-300"
          >
            Aplicar filtros
          </button>
        </footer>
      </aside>
    </>
  );
}
