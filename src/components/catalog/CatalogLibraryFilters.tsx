"use client";

import FilterDrawer from "@/components/library/FilterDrawer";
import { catalogFilterKeys, type CatalogFilterOptions } from "@/lib/catalogFilters";
import type { Dictionary } from "@/lib/types";

export default function CatalogLibraryFilters({ intl, options }: {
  intl: Dictionary;
  options: CatalogFilterOptions;
}) {
  const labels = intl.filters as Record<string, string>;
  const catalog = intl.catalog as Record<string, string>;
  const types: Record<string, string> = {
    manga: catalog.mangaColumn,
    comic: catalog.comicColumn,
    books: catalog.booksColumn,
    other: catalog.othersColumn,
  };
  const names = { series: labels.series, author: labels.authors, year: labels.years, publisher: labels.publishers, age: labels.ages, language: labels.languages, type: labels.types, genre: labels.genres, tag: labels.tags };
  const typeOrder = ["manga", "comic", "books", "other"];
  const groups = catalogFilterKeys.map((key) => ({
    key,
    label: names[key],
    options: (key === "type"
      ? [...options[key]].sort((a, b) => typeOrder.indexOf(a.value) - typeOrder.indexOf(b.value))
      : options[key]).map((option) => ({
      ...option,
      label: key === "type" ? types[option.value] : key === "author" && option.value === "__unknown__" ? catalog.unknownAuthor : option.label,
    })),
  }));
  return <FilterDrawer intl={intl} groups={groups} />;
}
