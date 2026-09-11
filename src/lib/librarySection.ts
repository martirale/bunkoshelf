export type LibrarySection = "manga" | "others";
export type LibraryContentSection = "manga" | "comic" | "other";
export type LibraryScope = "all" | LibrarySection;

export function isOthersLibraryItem(section: LibraryContentSection) {
  return section !== "manga";
}

export function getLibraryScope(section: LibrarySection): LibraryScope {
  if (section === "others") {
    return "others";
  }

  return "manga";
}

export function getLibrarySection(section: LibraryContentSection): LibrarySection {
  if (isOthersLibraryItem(section)) {
    return "others";
  }

  return "manga";
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
  return section === "others"
    ? `/${lang}/favorites/others`
    : `/${lang}/favorites/manga`;
}
