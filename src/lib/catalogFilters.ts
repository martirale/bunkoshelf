import { filterValues, type FilterOption } from "./libraryFilters";

export const catalogFilterKeys = ["series", "author", "year", "publisher", "age", "language", "type"] as const;
export type CatalogFilterKey = typeof catalogFilterKeys[number];
export type CatalogFilters = Partial<Record<CatalogFilterKey, string[]>>;
export type CatalogFilterOptions = Record<CatalogFilterKey, FilterOption[]>;

export function parseCatalogFilters(params: Record<string, string | string[] | undefined>): CatalogFilters {
  return Object.fromEntries(catalogFilterKeys.map((key) => [key, filterValues(params[key])]));
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
    params.push(values);
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
