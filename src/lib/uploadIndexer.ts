import path from "path";
import crypto from "crypto";
import {
  syncVolumeMetadataAndTaxonomy,
  upsertSeriesRecord,
  upsertVolumeRecord,
} from "@/lib/db/ingestion";
import type { ComicMetadata } from "@/lib/types";

interface IndexUploadParams {
  fileName: string;
  fullPath: string;
  dirName: string;
  seriesPath: string;
  isOneshot: boolean;
  coverFilename: string | null;
  metadata: ComicMetadata | null;
  genres: string[] | null;
  tags: string[] | null;
  fileSize: number;
}

export function toSlug(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateChecksum(): string {
  return crypto.randomBytes(8).toString("hex");
}

export async function indexUploadedVolume({
  fileName,
  fullPath,
  dirName,
  seriesPath,
  isOneshot,
  coverFilename,
  metadata,
  genres,
  tags,
  fileSize,
}: IndexUploadParams) {
  const cleanTitle = dirName.replace(/\[oneshot\]/gi, "").trim();
  const seriesSlug = toSlug(cleanTitle);
  const resolvedIsOneshot = isOneshot || /\[oneshot\]/i.test(dirName);

  const mangaSeries = await upsertSeriesRecord({
    slug: seriesSlug,
    title: cleanTitle,
    path: seriesPath,
    isOneshot: resolvedIsOneshot,
    mtime: new Date(),
  });

  const volTitle = path.basename(fileName, path.extname(fileName));
  const volSlug = toSlug(volTitle);

  const mangaVolume = await upsertVolumeRecord({
    slug: volSlug,
    title: volTitle,
    filename: fileName,
    fullPath,
    size: fileSize || 0,
    mtime: new Date(),
    coverImage: coverFilename || null,
    seriesId: mangaSeries.id,
  });

  if (metadata) {
    await syncVolumeMetadataAndTaxonomy({
      volumeId: mangaVolume.id,
      filePath: fullPath,
      metadata,
      genres: genres ?? [],
      tags: tags ?? [],
    });
  }

  const checksum = generateChecksum();
  const txtFileName = `${path.parse(fileName).name}.txt`;

  return { mangaSeries, mangaVolume, checksum, txtFileName };
}
