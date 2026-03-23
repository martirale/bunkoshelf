import type { ComicMetadata, ComicInfoResult } from "@/lib/types";

function getTextContent(doc: Element, tagName: string): string | null {
  const el = doc.getElementsByTagName(tagName)[0];
  return el ? el.textContent || null : null;
}

function transformMeta(doc: Element): ComicMetadata {
  const get = (tag: string) => getTextContent(doc, tag);

  return {
    series: get("Series"),
    title: get("Title"),
    number: get("Number") ? parseFloat(get("Number")!) : null,
    count: get("Count") ? parseInt(get("Count")!, 10) : null,
    publisher: get("Publisher"),
    imprint: get("Imprint"),
    languageISO: get("LanguageISO"),
    format: get("Format"),
    ageRating: get("AgeRating"),
    communityRating: get("CommunityRating")
      ? parseFloat(get("CommunityRating")!)
      : null,
    writer: get("Writer"),
    penciller: get("Penciller"),
    inker: get("Inker"),
    colorist: get("Colorist"),
    letterer: get("Letterer"),
    coverArtist: get("CoverArtist"),
    editor: get("Editor"),
    summary: get("Summary"),
    web: get("Web"),
    pageCount: get("PageCount") ? parseInt(get("PageCount")!, 10) : null,
    year: get("Year") ? parseInt(get("Year")!, 10) : null,
    month: get("Month") ? parseInt(get("Month")!, 10) : null,
    day: get("Day") ? parseInt(get("Day")!, 10) : null,
    gtin: get("GTIN"),
    mangaStyle: get("Manga"),
  };
}

function extractGenresAndTags(doc: Element): { genres: string[]; tags: string[] } {
  const genres: string[] = [];
  const tags: string[] = [];

  const genreText = getTextContent(doc, "Genre");
  if (genreText) {
    genres.push(
      ...genreText
        .split(/[;,]/)
        .map((g) => g.trim())
        .filter(Boolean)
    );
  }

  const tagsText = getTextContent(doc, "Tags");
  if (tagsText) {
    tags.push(
      ...tagsText
        .split(/[;,]/)
        .map((t) => t.trim())
        .filter(Boolean)
    );
  }

  return { genres, tags };
}

export function parseComicInfo(xmlString: string): ComicInfoResult | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");

  const errorNode = doc.querySelector("parsererror");
  if (errorNode) {
    console.error("Error al parsear ComicInfo.xml:", errorNode.textContent);
    return null;
  }

  const comicInfo = doc.getElementsByTagName("ComicInfo")[0];
  if (!comicInfo) {
    return null;
  }

  const metadata = transformMeta(comicInfo);
  const { genres, tags } = extractGenresAndTags(comicInfo);

  return { metadata, genres, tags };
}
