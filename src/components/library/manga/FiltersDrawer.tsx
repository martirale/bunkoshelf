"use client";

import React, { useState, useEffect } from "react";
import FilterDrawer from "@/components/library/FilterDrawer";
import { getLibraryFilters } from "@/actions/library";
import { getBookLibraryFilters } from "@/actions/books";
import { usePwa } from "@/components/pwa/PwaProvider";
import type { OfflineVolume } from "@/lib/client/offlineLibrary";
import type { LibraryScope } from "@/lib/librarySection";
import type { DictionarySection } from "@/lib/types";

interface FilterItem {
  id: string;
  name: string;
}

interface FiltersDrawerProps {
  intl: DictionarySection;
  scope?: LibraryScope;
  library?: "books";
  offlineVolumes?: OfflineVolume[];
}

export default function FiltersDrawer({
  intl,
  scope = "all",
  library,
  offlineVolumes,
}: FiltersDrawerProps) {
  const [authors, setAuthors] = useState<FilterItem[]>([]);
  const [genres, setGenres] = useState<FilterItem[]>([]);
  const [tags, setTags] = useState<FilterItem[]>([]);
  const [publishers, setPublishers] = useState<FilterItem[]>([]);
  const { online } = usePwa();

  const filters = intl.filters as DictionarySection;
  const catalog = intl.catalog as DictionarySection | undefined;
  const unknownAuthorLabel =
    (catalog?.unknownAuthor as string | undefined) || "Unknown";

  useEffect(() => {
    async function fetchFilters() {
      if (!online && offlineVolumes) {
        const authors = new Set<string>();
        const genres = new Set<string>();
        const tags = new Set<string>();
        const publishers = new Set<string>();

        offlineVolumes.forEach((volume) => {
          const publisher = volume.metadata.publisher;
          if (typeof publisher === "string" && publisher.trim()) publishers.add(publisher.trim());
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
        return;
      }

      try {
        const data = library === "books"
          ? await getBookLibraryFilters()
          : await getLibraryFilters({ scope });
        if (!data || "error" in data) throw new Error("Error fetching filters");
        setAuthors(data.authors);
        setGenres(data.genres);
        setTags(data.tags);
        setPublishers(data.publishers);
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

  return <FilterDrawer intl={intl} groups={groups} offline={!online} />;
}
