"use client";

import { useState, useEffect, type ReactNode } from "react";
import FilterDrawer from "@/components/library/FilterDrawer";
import { getLibraryFilters } from "@/actions/library";
import { getBookLibraryFilters } from "@/actions/books";
import { usePwa } from "@/components/pwa/PwaProvider";
import type { OfflineVolume } from "@/lib/client/offlineLibrary";
import type { LibraryScope } from "@/lib/librarySection";
import { getLibraryFilterTitle } from "@/lib/libraryFilters";
import type { Dictionary, DictionarySection, Locale } from "@/lib/types";

interface FilterItem {
  id: string;
  name: string;
}

interface FiltersDrawerProps {
  intl: Dictionary;
  lang: Locale;
  title: string;
  icon: ReactNode;
  scope?: LibraryScope;
  library?: "books";
  offlineVolumes?: OfflineVolume[];
}

export default function FiltersDrawer({
  intl,
  lang,
  title,
  icon,
  scope = "all",
  library,
  offlineVolumes,
}: FiltersDrawerProps) {
  const [authors, setAuthors] = useState<FilterItem[]>([]);
  const [genres, setGenres] = useState<FilterItem[]>([]);
  const [tags, setTags] = useState<FilterItem[]>([]);
  const [publishers, setPublishers] = useState<FilterItem[]>([]);
  const [imprints, setImprints] = useState<FilterItem[]>([]);
  const { online } = usePwa();

  const filters = intl.filters as DictionarySection;
  const comicTypeLabels = intl.libraries.comicTypes as DictionarySection;
  const unknownAuthorLabel =
    (intl.catalog?.unknownAuthor as string | undefined) || "Unknown";

  useEffect(() => {
    async function fetchFilters() {
      if (!online && offlineVolumes) {
        const authors = new Set<string>();
        const genres = new Set<string>();
        const tags = new Set<string>();
        const publishers = new Set<string>();
        const imprints = new Set<string>();

        offlineVolumes.forEach((volume) => {
          const publisher = volume.metadata.publisher;
          if (typeof publisher === "string" && publisher.trim()) publishers.add(publisher.trim());
          const imprint = volume.metadata.imprint;
          if (typeof imprint === "string" && imprint.trim()) imprints.add(imprint.trim());
          const writer = volume.metadata.writer;
          if (typeof writer === "string") {
            writer.split(",").map((item) => item.trim()).filter(Boolean).forEach((item) => authors.add(item));
          }
          const volumeGenres = volume.metadata.genres;
          if (Array.isArray(volumeGenres)) volumeGenres.forEach((item) => genres.add(String(item)));
          const volumeTags = volume.metadata.tags;
          if (Array.isArray(volumeTags)) volumeTags.forEach((item) => tags.add(String(item)));
        });

        setAuthors(Array.from(authors).sort().map((name) => ({ id: name, name })));
        setGenres(Array.from(genres).sort().map((name) => ({ id: name, name })));
        setTags(Array.from(tags).sort().map((name) => ({ id: name, name })));
        setPublishers(Array.from(publishers).sort().map((name) => ({ id: name, name })));
        setImprints(Array.from(imprints).sort().map((name) => ({ id: name, name })));
        return;
      }

      try {
        const data = library === "books"
          ? { ...await getBookLibraryFilters(), imprints: [] }
          : await getLibraryFilters({ scope });
        if (!data || "error" in data) throw new Error("Error fetching filters");
        setAuthors(data.authors);
        setGenres(data.genres);
        setTags(data.tags);
        setPublishers(data.publishers);
        setImprints(data.imprints);
      } catch (e) {
        console.error(e);
      }
    }
    fetchFilters();
  }, [library, offlineVolumes, online, scope]);

  const groups = [
    { key: "author", label: filters.authors as string, commaSeparated: true, options: authors.map((item) => ({ value: item.name, label: item.name === "__unknown__" ? unknownAuthorLabel : item.name })) },
    { key: "genre", label: filters.genres as string, commaSeparated: true, options: genres.map((item) => ({ value: item.name, label: item.name })) },
    { key: "tag", label: filters.tags as string, commaSeparated: true, options: tags.map((item) => ({ value: item.name, label: item.name })) },
    { key: "publisher", label: filters.publishers as string, options: publishers.map((item) => ({ value: item.name, label: item.name })) },
  ];
  if (library !== "books") {
    groups.push({ key: "imprint", label: filters.imprints as string, options: imprints.map((item) => ({ value: item.name, label: item.name })) });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <FilterDrawer
        intl={intl}
        groups={groups}
        offline={!online}
        renderHeading={(applied) => (
          <h2 className="flex min-w-0 items-center gap-2 text-base md:text-lg">
            <span className="shrink-0" aria-hidden="true">{icon}</span>
            <span className="min-w-0 wrap-anywhere">
              {getLibraryFilterTitle(applied, title, lang, library ?? scope, comicTypeLabels, unknownAuthorLabel)}
            </span>
          </h2>
        )}
      />
    </div>
  );
}
