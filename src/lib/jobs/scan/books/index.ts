import fs from "node:fs/promises";
import path from "node:path";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import { indexBook } from "@/lib/books/indexer";
import { getBookChecksums, removeMissingBooks, saveBookChecksum } from "@/lib/db/books/library";
import { indexUploadedVolume } from "@/lib/uploadIndexer";
import { revalidateMangaLibraryCache } from "@/lib/mangaLibraryCache";

const LIBRARY_ROOT = path.resolve(process.cwd(), "../library");
const SOURCES = [
  { directory: "books", librarySection: "books" as const },
  { directory: "others", librarySection: "other" as const },
];

export async function scanBooks(): Promise<{ indexed: number; errors: string[] }> {
  const errors: string[] = [];
  let indexed = 0;
  const knownChecksums = await getBookChecksums();
  const existingPaths = new Set<string>();
  if ((process.env.LIB_PROVIDER || "local") === "cloud") {
    for (const source of SOURCES) {
      const prefix = `library/${source.directory}/`;
      const response = await r2Client.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, Prefix: prefix }));
      for (const item of response.Contents ?? []) {
        if (!item.Key?.toLowerCase().endsWith(".epub")) continue;
        const relative = item.Key.replace(prefix, "");
        const fullPath = `/${item.Key}`;
        existingPaths.add(fullPath);
        const checksum = `${item.ETag ?? ""}:${item.Size ?? 0}:${item.LastModified?.getTime() ?? 0}`;
        if (knownChecksums.get(fullPath) === checksum) continue;
        try {
          const directory = path.posix.dirname(relative);
          const seriesPath = directory === "." ? `/${prefix.slice(0, -1)}` : `/${prefix}${directory}`;
          const seriesName = directory === "." ? source.directory : path.posix.basename(directory);
          const result = await indexBook({ fullPath, filename: path.posix.basename(relative), seriesPath,
            seriesName, size: item.Size ?? 0, mtime: item.LastModified ?? new Date(), librarySection: source.librarySection });
          if (source.librarySection === "other") {
            await indexUploadedVolume({
              fileName: path.posix.basename(relative),
              fullPath,
              dirName: seriesName,
              seriesPath,
              isOneshot: /\[oneshot\]/i.test(seriesName),
              coverFilename: null,
              metadata: result.comicMetadata,
              genres: result.genres,
              tags: [],
              fileSize: item.Size ?? 0,
              librarySection: "other",
            });
          }
          await saveBookChecksum(fullPath, checksum);
          indexed++;
        } catch (error) { errors.push(`${item.Key}: ${(error as Error).message}`); }
      }
    }
    await removeMissingBooks(existingPaths);
    revalidateMangaLibraryCache();
    return { indexed, errors };
  }
  for (const source of SOURCES) {
    const root = path.join(LIBRARY_ROOT, source.directory);
    await fs.mkdir(root, { recursive: true });
    const directories = await fs.readdir(root, { withFileTypes: true });
    for (const directory of directories.filter((entry) => entry.isDirectory())) {
      const seriesPath = path.join(root, directory.name);
      const files = await fs.readdir(seriesPath, { withFileTypes: true });
      for (const file of files.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".epub"))) {
        const fullPath = path.join(seriesPath, file.name);
        existingPaths.add(fullPath);
        try {
          const stat = await fs.stat(fullPath);
          const checksum = `${stat.size}:${stat.mtimeMs}`;
          if (knownChecksums.get(fullPath) === checksum) continue;
          const result = await indexBook({ fullPath, filename: file.name, seriesPath, seriesName: directory.name, size: stat.size, mtime: stat.mtime, librarySection: source.librarySection });
          if (source.librarySection === "other") {
            await indexUploadedVolume({
              fileName: file.name,
              fullPath,
              dirName: directory.name,
              seriesPath,
              isOneshot: /\[oneshot\]/i.test(directory.name),
              coverFilename: null,
              metadata: result.comicMetadata,
              genres: result.genres,
              tags: [],
              fileSize: stat.size,
              librarySection: "other",
            });
          }
          await saveBookChecksum(fullPath, checksum);
          indexed++;
        } catch (error) { errors.push(`${fullPath}: ${(error as Error).message}`); }
      }
    }
  }
  await removeMissingBooks(existingPaths);
  revalidateMangaLibraryCache();
  return { indexed, errors };
}
