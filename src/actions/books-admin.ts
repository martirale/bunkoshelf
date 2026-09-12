"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { verifySession } from "@/lib/auth/verifySession";
import { indexBook } from "@/lib/books/indexer";
import {
  countBookVolumesBySeriesId,
  deleteBookChecksums,
  deleteBookSeriesRecord,
  deleteBookVolumeRecord,
  findBookSeriesBySlug,
  findBookVolumeBySlug,
  listBookVolumes,
} from "@/lib/db/books/library";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const provider = process.env.LIB_PROVIDER || "local";
const booksRoot = path.resolve(process.cwd(), "../library/books");

type BookAdminResult = { ok: true; indexed?: number } | { ok: false; error: string };

async function requireAdmin(): Promise<BookAdminResult | null> {
  const user = await verifySession();
  if (!user) return { ok: false, error: "Unauthorized" };
  if (!user.isAdmin) return { ok: false, error: "Forbidden" };
  return null;
}

function getCloudKey(filePath: string): string {
  const key = filePath.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!key.startsWith("library/books/")) throw new Error("Invalid book storage path");
  return key;
}

function getLocalPath(filePath: string): string {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(`${booksRoot}${path.sep}`)) throw new Error("Invalid book storage path");
  return resolved;
}

function checksumPath(filePath: string): string {
  const extension = provider === "cloud" ? path.posix : path;
  return extension.join(extension.dirname(filePath), `${extension.parse(filePath).name}.txt`);
}

async function deleteCloudPrefix(prefix: string): Promise<void> {
  let continuationToken: string | undefined;
  do {
    const response = await r2Client.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }));
    const objects = response.Contents?.flatMap((item) => item.Key ? [{ Key: item.Key }] : []) ?? [];
    if (objects.length) await r2Client.send(new DeleteObjectsCommand({ Bucket: R2_BUCKET, Delete: { Objects: objects } }));
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);
}

export async function rescanBookVolume(slug: string): Promise<BookAdminResult> {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    const volume = await findBookVolumeBySlug(slug);
    if (!volume) return { ok: false, error: "Book not found" };
    await indexBook({
      fullPath: volume.fullPath,
      filename: volume.filename,
      seriesPath: volume.series.path,
      seriesName: volume.series.title,
      size: volume.size,
      mtime: new Date(),
      isOneshot: volume.series.isOneshot,
    });
    return { ok: true, indexed: 1 };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not rescan book" };
  }
}

export async function rescanBookSeries(slug: string): Promise<BookAdminResult> {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    const series = await findBookSeriesBySlug(slug);
    if (!series) return { ok: false, error: "Series not found" };
    const volumes = await listBookVolumes({ seriesSlug: slug });
    for (const volume of volumes) {
      await indexBook({
        fullPath: volume.fullPath,
        filename: volume.filename,
        seriesPath: series.path,
        seriesName: series.title,
        size: volume.size,
        mtime: new Date(),
        isOneshot: series.isOneshot,
      });
    }
    return { ok: true, indexed: volumes.length };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not rescan series" };
  }
}

export async function deleteBookVolume(slug: string): Promise<BookAdminResult> {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    const volume = await findBookVolumeBySlug(slug);
    if (!volume) return { ok: false, error: "Book not found" };
    const checksum = checksumPath(volume.fullPath);
    if (provider === "cloud") {
      await Promise.all([
        r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: getCloudKey(volume.fullPath) })),
        r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: getCloudKey(checksum) })),
      ]);
    } else {
      await Promise.all([fs.rm(getLocalPath(volume.fullPath), { force: true }), fs.rm(getLocalPath(checksum), { force: true })]);
    }
    await deleteBookChecksums([volume.fullPath, checksum]);
    await deleteBookVolumeRecord(volume.id);
    if (await countBookVolumesBySeriesId(volume.series.id) === 0) await deleteBookSeriesRecord(volume.series.id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete book" };
  }
}

export async function deleteBookSeries(slug: string): Promise<BookAdminResult> {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    const series = await findBookSeriesBySlug(slug);
    if (!series) return { ok: false, error: "Series not found" };
    const volumes = await listBookVolumes({ seriesSlug: slug });
    if (provider === "cloud") {
      const prefix = getCloudKey(series.path).replace(/\/?$/, "/");
      await deleteCloudPrefix(prefix);
    } else {
      await fs.rm(getLocalPath(series.path), { recursive: true, force: true });
    }
    await deleteBookChecksums(volumes.flatMap((volume) => [volume.fullPath, checksumPath(volume.fullPath)]));
    await deleteBookSeriesRecord(series.id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete series" };
  }
}
