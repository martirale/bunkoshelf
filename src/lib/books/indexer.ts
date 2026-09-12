import path from "node:path";
import { parseEpubBuffer } from "./epubParser";
import { readBookFile } from "./storage";
import { upsertBook } from "@/lib/db/books/library";

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
}) {
  if (path.extname(input.filename).toLowerCase() !== ".epub") {
    throw new Error("Only .epub files are supported in Books");
  }
  const parsed = await parseEpubBuffer(await readBookFile(input.fullPath));
  const collection = parsed.metadata.collection;
  const folderSeriesTitle = input.seriesName.replace(/\[oneshot\]/gi, "").trim();
  const seriesTitle = collection?.title || folderSeriesTitle || parsed.metadata.title;
  return upsertBook({
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
  });
}
