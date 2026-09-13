import path from "node:path";
import { parseEpubBuffer } from "./epubParser";
import { readBookFile } from "./storage";
import { upsertBook } from "@/lib/db/books/library";
import type { ComicMetadata } from "@/lib/types/manga";

export function toBookSlug(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function indexBook(input: {
  fullPath: string;
  filename: string;
  seriesPath: string;
  seriesName: string;
  size: number;
  mtime: Date;
  isOneshot?: boolean;
  librarySection?: "books" | "other";
}) {
  if (path.extname(input.filename).toLowerCase() !== ".epub") {
    throw new Error("Only .epub files are supported in Books");
  }
  const parsed = await parseEpubBuffer(await readBookFile(input.fullPath));
  const collection = parsed.metadata.collection;
  const folderSeriesTitle = input.seriesName.replace(/\[oneshot\]/gi, "").trim();
  const seriesTitle = collection?.title || folderSeriesTitle || parsed.metadata.title;
  const comicMetadata: ComicMetadata = {
    series: seriesTitle,
    title: parsed.metadata.title,
    number: collection?.position ?? null,
    count: null,
    publisher: parsed.metadata.publisher,
    imprint: null,
    languageISO: parsed.metadata.language,
    format: "EPUB",
    ageRating: parsed.metadata.ageRating,
    communityRating: null,
    writer: parsed.metadata.people.filter((person) => person.kind === "creator").map((person) => person.name).join(", ") || null,
    penciller: null,
    inker: null,
    colorist: null,
    letterer: null,
    coverArtist: null,
    editor: null,
    summary: parsed.metadata.description,
    web: null,
    pageCount: null,
    year: parsed.metadata.publishedAt ? Number.parseInt(parsed.metadata.publishedAt, 10) || null : null,
    month: null,
    day: null,
    gtin: parsed.metadata.identifiers.find((identifier) => identifier.isPrimary)?.value ?? null,
    mangaStyle: "No",
  };
  const book = await upsertBook({
    seriesTitle,
    seriesPath: input.seriesPath,
    isOneshot: collection ? false : input.isOneshot ?? /\[oneshot\]/i.test(input.seriesName),
    collectionType: collection?.type ?? null,
    volumeNumber: collection?.position ?? null,
    seriesSlug: toBookSlug(seriesTitle),
    volumeSlug: toBookSlug(path.basename(input.filename, ".epub")),
    filename: input.filename,
    fullPath: input.fullPath,
    size: input.size,
    mtime: input.mtime,
    metadata: parsed.metadata,
    librarySection: input.librarySection ?? "books",
  });
  return { book, comicMetadata, genres: parsed.metadata.subjects.map((subject) => subject.name) };
}
