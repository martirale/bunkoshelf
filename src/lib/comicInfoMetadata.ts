import type { ComicMetadata } from "./types/manga.ts";

export function transformComicMetadata(meta: Record<string, string[]>): ComicMetadata {
  const getFirst = (field: string): string | null =>
    (meta[field] && meta[field][0]) || null;

  return {
    series: getFirst("Series"),
    title: getFirst("Title"),
    altTitle: getFirst("AltTitle")?.trim() || null,
    altSeries: getFirst("AltSeries")?.trim() || null,
    number: getFirst("Number") ? parseFloat(getFirst("Number")!) : null,
    count: getFirst("Count") ? parseInt(getFirst("Count")!, 10) : null,
    publisher: getFirst("Publisher"),
    imprint: getFirst("Imprint"),
    languageISO: getFirst("LanguageISO"),
    format: getFirst("Format"),
    ageRating: getFirst("AgeRating"),
    communityRating: getFirst("CommunityRating")
      ? parseFloat(getFirst("CommunityRating")!)
      : null,
    writer: getFirst("Writer"),
    penciller: getFirst("Penciller"),
    inker: getFirst("Inker"),
    colorist: getFirst("Colorist"),
    letterer: getFirst("Letterer"),
    coverArtist: getFirst("CoverArtist"),
    editor: getFirst("Editor"),
    summary: getFirst("Summary"),
    web: getFirst("Web"),
    pageCount: getFirst("PageCount")
      ? parseInt(getFirst("PageCount")!, 10)
      : null,
    year: getFirst("Year") ? parseInt(getFirst("Year")!, 10) : null,
    month: getFirst("Month") ? parseInt(getFirst("Month")!, 10) : null,
    day: getFirst("Day") ? parseInt(getFirst("Day")!, 10) : null,
    gtin: getFirst("GTIN"),
    mangaStyle: getFirst("Manga"),
  };
}

export function extractGenresAndTags(meta: Record<string, string[]>): {
  genres: string[];
  tags: string[];
} {
  const genres: string[] = [];
  const tags: string[] = [];

  if (meta.Genre && meta.Genre[0]) {
    const genreList = meta.Genre[0]
      .split(/[;,]/)
      .map((g) => g.trim())
      .filter(Boolean);
    genres.push(...genreList);
  }

  if (meta.Tags && meta.Tags[0]) {
    const tagList = meta.Tags[0]
      .split(/[;,]/)
      .map((t) => t.trim())
      .filter(Boolean);
    tags.push(...tagList);
  }

  return { genres, tags };
}

