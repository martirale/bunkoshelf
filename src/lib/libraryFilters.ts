import type { LibraryScope } from "@/lib/librarySection";
import type { DictionarySection, Locale } from "@/lib/types";

export const mangaDemographics = [
  { tag: "shonen", label: "Shōnen" },
  { tag: "shojo", label: "Shōjo" },
  { tag: "seinen", label: "Seinen" },
  { tag: "josei", label: "Josei" },
];

export const comicTypes = [
  { key: "comic", es: "cómic", en: "comic" },
  { key: "graphicNovel", es: "novela gráfica", en: "graphic novel" },
  { key: "manhwa", es: "manhwa", en: "manhwa" },
  { key: "manhua", es: "manhua", en: "manhua" },
];

export interface LibrarySearchParams {
  page?: string;
  author?: string;
  genre?: string;
  tag?: string;
  publisher?: string | string[];
  imprint?: string | string[];
  includeOneshots?: string;
}

export function filterValues(value?: string | string[] | null): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map((entry) => entry.trim()).filter(Boolean))];
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  commaSeparated?: boolean;
}

export function readFilterSelection(params: URLSearchParams, groups: FilterGroup[]) {
  return Object.fromEntries(groups.map((group) => {
    const values = params.getAll(group.key);
    return [group.key, filterValues(group.commaSeparated ? values.flatMap((value) => value.split(",")) : values)];
  }));
}

function normalizeTag(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function getLibraryFilterTitle(
  applied: Record<string, string[]>,
  fallback: string,
  lang: Locale,
  section: LibraryScope | "books",
  comicTypeLabels: DictionarySection,
  unknownAuthorLabel: string,
) {
  const labels = Object.entries(applied).flatMap(([key, values]) =>
    values.map((value) => {
      if (key === "author") return value === "__unknown__" ? unknownAuthorLabel : value;
      if (key === "tag") {
        const tag = normalizeTag(value);
        if (section === "manga") {
          const demographic = mangaDemographics.find((item) => item.tag === tag);
          if (demographic) return demographic.label;
        }
        if (section === "comic") {
          const comicType = comicTypes.find((item) => normalizeTag(item.es) === tag || item.en === tag);
          const label = comicType && comicTypeLabels[comicType.key];
          if (typeof label === "string") return label;
        }
      }
      if (key === "genre" || key === "tag") return value.charAt(0).toLocaleUpperCase(lang) + value.slice(1);
      return value;
    })
  );

  return labels.length
    ? new Intl.ListFormat(lang).format([...new Set(labels)])
    : fallback;
}

export function updateFilterParams(params: URLSearchParams, groups: FilterGroup[], selection: Record<string, string[]>) {
  const next = new URLSearchParams(params);
  for (const group of groups) {
    next.delete(group.key);
    const values = selection[group.key] ?? [];
    if (group.commaSeparated && values.length) next.set(group.key, values.join(","));
    else values.forEach((value) => next.append(group.key, value));
  }
  next.set("page", "1");
  return next;
}
