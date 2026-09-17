import path from "path";
import { extractCoverCbz } from "./covers/cbz";
import { extractMetadataCbz } from "./meta/cbz";
import type { ComicInfoResult, StorageProvider } from "@/lib/types";

export type CoverExtractor = (
  fullPath: string,
  outputDir: string,
  provider: StorageProvider
) => Promise<string | null>;

export type MetadataExtractor = (
  fullPath: string,
  provider: StorageProvider
) => Promise<ComicInfoResult | null>;

export async function getCoverExtractor(
  filePath: string
): Promise<CoverExtractor | null> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".cbz" || ext === ".zip") return extractCoverCbz;
  if (ext === ".cbr" || ext === ".rar") {
    const { extractCoverCbr } = await import("./covers/cbr");
    return extractCoverCbr;
  }

  return null;
}

export async function getMetadataExtractor(
  filePath: string
): Promise<MetadataExtractor | null> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".cbz" || ext === ".zip") return extractMetadataCbz;
  if (ext === ".cbr" || ext === ".rar") {
    const { extractMetadataCbr } = await import("./meta/cbr");
    return extractMetadataCbr;
  }

  return null;
}

export async function extractArchiveMetadata(
  filePath: string,
  provider: StorageProvider
): Promise<ComicInfoResult | null> {
  const extractor = await getMetadataExtractor(filePath);
  return extractor ? extractor(filePath, provider) : null;
}
