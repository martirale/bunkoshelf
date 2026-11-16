import xml2js from "xml2js";
import { transformComicMetadata, extractGenresAndTags } from "./comicInfoMetadata.ts";
import type { ComicInfoResult } from "./types/manga.ts";

export async function parseComicInfoDocument(xml: string): Promise<ComicInfoResult> {
  if (typeof xml !== "string" || Buffer.byteLength(xml, "utf8") > 2 * 1024 * 1024 || /<!DOCTYPE/i.test(xml)) {
    throw new Error("invalidXml");
  }

  try {
    const parser = new xml2js.Parser({ tagNameProcessors: [xml2js.processors.stripPrefix] });
    const document = await parser.parseStringPromise(xml);
    const root = document && Object.keys(document).find((key) => key.toLowerCase() === "comicinfo");
    if (!root) throw new Error("invalidXml");
    const meta = document[root] || {};
    if (typeof meta !== "object") throw new Error("invalidXml");
    const fields = [
      "Title", "Series", "AltTitle", "AltSeries", "Number", "Count", "Summary", "Year", "Month", "Day",
      "Writer", "Penciller", "Inker", "Colorist", "Letterer", "CoverArtist", "Editor", "Publisher", "Imprint",
      "Web", "PageCount", "LanguageISO", "Format", "Manga", "AgeRating", "CommunityRating", "GTIN", "Genre", "Tags",
    ];
    for (const key of fields) {
      const values = meta[key];
      if (values !== undefined && (!Array.isArray(values) || values.length !== 1 || typeof values[0] !== "string")) throw new Error("invalidXml");
    }
    const metadata = transformComicMetadata(meta);
    if (Object.values(metadata).some((value) => typeof value === "number" && !Number.isFinite(value))) {
      throw new Error("invalidXml");
    }
    return { metadata, ...extractGenresAndTags(meta) };
  } catch {
    throw new Error("invalidXml");
  }
}
