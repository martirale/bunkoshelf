import { ageRatingMap, comicAgeRatingMinimum } from "./mangaMetadata";
import { filterValues, type FilterOption } from "./libraryFilters";
import type { OneshotSection } from "./librarySection";
import type { Locale } from "./types";

export const catalogFilterKeys = ["series", "author", "year", "publisher", "age", "language", "type", "genre", "tag"] as const;
export type CatalogFilterKey = typeof catalogFilterKeys[number];
export type CatalogFilters = Partial<Record<CatalogFilterKey, string[]>>;
export type CatalogFilterOptions = Record<CatalogFilterKey, FilterOption[]>;

export function getCatalogLibraryFilterHref(lang: Locale, section: OneshotSection, filter: "author" | "genre" | "tag", value: string) {
  const query = new URLSearchParams({ [filter]: value, type: section === "others" ? "other" : section });
  return `/${lang}/catalog/library?${query}`;
}

export function parseCatalogFilters(params: Record<string, string | string[] | undefined>): CatalogFilters {
  return Object.fromEntries(catalogFilterKeys.map((key) => [key, filterValues(params[key])]));
}

export function normalizeCatalogAgeRating(value: string | null | undefined): string | null {
  const rating = value?.trim();
  if (!rating) return null;
  const minimum = ageRatingMap(rating);
  return minimum !== null ? `${minimum}+` : /^\d+\+$/.test(rating) ? rating : null;
}

function expandAgeRatings(values: string[]): string[] {
  const ages = filterValues(values.map(normalizeCatalogAgeRating).filter((value): value is string => value !== null));
  const aliases = Object.entries(comicAgeRatingMinimum)
    .filter(([, minimum]) => minimum !== null && ages.includes(`${minimum}+`))
    .map(([rating]) => rating);
  return filterValues([...values, ...ages, ...aliases]);
}

export function buildCatalogFilterSql(filters: CatalogFilters, params: unknown[]): string {
  const columns = {
    series: "library_section || ':' || series_slug",
    year: "year::text",
    publisher: "BTRIM(publisher)",
    age: "BTRIM(age_rating)",
    language: "BTRIM(language_iso)",
    type: "library_section",
  };
  const conditions = catalogFilterKeys.flatMap((key) => {
    const values = filterValues(filters[key]);
    if (!values.length) return [];
    params.push(key === "age" ? expandAgeRatings(values) : values);
    if (key === "author") {
      return [`author_names && $${params.length}::text[]`];
    }
    if (key === "genre" || key === "tag") {
      const column = key === "genre" ? "genres" : "tags";
      return [`EXISTS (
        SELECT 1
        FROM unnest(${column}) AS relation(name)
        INNER JOIN unnest($${params.length}::text[]) AS selected(name)
          ON LOWER(BTRIM(relation.name)) = LOWER(selected.name)
      )`];
    }
    return [`${columns[key]} = ANY($${params.length}::text[])`];
  });
  return conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
}
