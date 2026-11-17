import { ageRatingMap, comicAgeRatingMinimum } from "./mangaMetadata";
import { filterValues, type FilterOption } from "./libraryFilters";

export const catalogFilterKeys = ["series", "author", "year", "publisher", "age", "language", "type"] as const;
export type CatalogFilterKey = typeof catalogFilterKeys[number];
export type CatalogFilters = Partial<Record<CatalogFilterKey, string[]>>;
export type CatalogFilterOptions = Record<CatalogFilterKey, FilterOption[]>;

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
      return [`EXISTS (
        SELECT 1
        FROM regexp_split_to_table(COALESCE(NULLIF(BTRIM(writer), ''), '__unknown__'), ',') AS author(name)
        WHERE BTRIM(author.name) = ANY($${params.length}::text[])
      )`];
    }
    return [`${columns[key]} = ANY($${params.length}::text[])`];
  });
  return conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
}
