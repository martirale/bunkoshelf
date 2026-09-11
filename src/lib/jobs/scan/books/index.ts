import fs from "node:fs/promises";
import path from "node:path";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import { indexBook } from "@/lib/books/indexer";
import { getBookChecksums, removeMissingBooks, saveBookChecksum } from "@/lib/db/books/library";

const ROOT = path.resolve(process.cwd(), "../library/books");

export async function scanBooks(): Promise<{ indexed: number; errors: string[] }> {
  const errors: string[] = [];
  let indexed = 0;
  const knownChecksums = await getBookChecksums();
  const existingPaths = new Set<string>();
  if ((process.env.LIB_PROVIDER || "local") === "cloud") {
    const response = await r2Client.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, Prefix: "library/books/" }));
    for (const item of response.Contents ?? []) {
      if (!item.Key?.toLowerCase().endsWith(".epub")) continue;
      const relative = item.Key.replace(/^library\/books\//, "");
      const parts = relative.split("/");
      if (parts.length < 2) continue;
      const fullPath = `/${item.Key}`;
      existingPaths.add(fullPath);
      const checksum = `${item.ETag ?? ""}:${item.Size ?? 0}:${item.LastModified?.getTime() ?? 0}`;
      if (knownChecksums.get(fullPath) === checksum) continue;
      try {
        await indexBook({ fullPath, filename: parts.at(-1)!, seriesPath: `/library/books/${parts[0]}`,
          seriesName: parts[0], size: item.Size ?? 0, mtime: item.LastModified ?? new Date() });
        await saveBookChecksum(fullPath, checksum);
        indexed++;
      } catch (error) { errors.push(`${item.Key}: ${(error as Error).message}`); }
    }
    await removeMissingBooks(existingPaths);
    return { indexed, errors };
  }
  await fs.mkdir(ROOT, { recursive: true });
  const directories = await fs.readdir(ROOT, { withFileTypes: true });
  for (const directory of directories.filter((entry) => entry.isDirectory())) {
    const seriesPath = path.join(ROOT, directory.name);
    const files = await fs.readdir(seriesPath, { withFileTypes: true });
    for (const file of files.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".epub"))) {
      const fullPath = path.join(seriesPath, file.name);
      existingPaths.add(fullPath);
      try {
        const stat = await fs.stat(fullPath);
        const checksum = `${stat.size}:${stat.mtimeMs}`;
        if (knownChecksums.get(fullPath) === checksum) continue;
        await indexBook({ fullPath, filename: file.name, seriesPath, seriesName: directory.name, size: stat.size, mtime: stat.mtime });
        await saveBookChecksum(fullPath, checksum);
        indexed++;
      } catch (error) { errors.push(`${fullPath}: ${(error as Error).message}`); }
    }
  }
  await removeMissingBooks(existingPaths);
  return { indexed, errors };
}
