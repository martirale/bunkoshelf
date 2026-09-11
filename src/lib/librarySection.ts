export type LibrarySection = "manga" | "comic" | "others";
export type LibraryContentSection = "manga" | "comic" | "other";
export type LibraryScope = "all" | LibrarySection;

export function getLibraryScope(section: LibrarySection): LibraryScope {
  return section;
}

export function getLibrarySection(section: LibraryContentSection): LibrarySection {
  return section === "other" ? "others" : section;
}

export function getLibraryRootHref(lang: string, section: LibrarySection) {
  return `/${lang}/${section}`;
}

export function getLibrarySeriesHref(
  lang: string,
  section: LibrarySection,
  slug: string
) {
  return `${getLibraryRootHref(lang, section)}/${slug}`;
}

export function getLibraryVolumeHref(
  lang: string,
  section: LibrarySection,
  slug: string
) {
  return `${getLibraryRootHref(lang, section)}/volume/${slug}`;
}

export function getFavoritesHref(lang: string, section: LibrarySection) {
  return `/${lang}/favorites/${section}`;
}
