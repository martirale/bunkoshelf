"use server";

import { updateTag } from "next/cache";
import { verifySession } from "@/lib/auth/verifySession";
import { findVolumeWithSeriesPathById, syncVolumeMetadataAndTaxonomy } from "@/lib/db/ingestion";
import { getPool } from "@/lib/db/pool";
import { readComicInfoArchive, writeComicInfoArchive } from "@/lib/comicInfoArchive";
import { readStoredComicArchive, writeStoredComicArchive, verifyStoredComicArchive, type ComicArchiveSnapshot } from "@/lib/comicInfoStorage";
import { parseComicInfoDocument } from "@/lib/comicInfoDocument";
import { MANGA_LIBRARY_TAG } from "@/lib/mangaLibraryCache";
import type { StorageProvider } from "@/lib/types";

const provider: StorageProvider = process.env.LIB_PROVIDER === "cloud" ? "cloud" : "local";

function memoryUsage() {
  const memory = process.memoryUsage();
  return {
    rssMiB: Math.round(memory.rss / 1024 / 1024),
    externalMiB: Math.round(memory.external / 1024 / 1024),
  };
}

function errorCode(error: unknown, fallback: string) {
  const code = error instanceof Error ? error.message : "";
  if (["invalidXml", "conflict", "duplicateXml", "unsupportedArchive", "syncError", "restoreError"].includes(code)) return code;
  if ((error as { name?: string })?.name === "PreconditionFailed") return "conflict";
  return fallback;
}

export async function getComicInfo(volumeId: string) {
  const user = await verifySession();
  if (!user?.isAdmin) return { ok: false as const, error: "unauthorized" };
  try {
    const volume = await findVolumeWithSeriesPathById(volumeId);
    if (!volume || !/\.(cbz|zip|cbr|rar)$/i.test(volume.fullPath)) return { ok: false as const, error: "loadError" };
    const snapshot = await readStoredComicArchive(volume.fullPath, provider);
    const { xml } = await readComicInfoArchive(snapshot.data);
    return { ok: true as const, xml, revision: snapshot.revision };
  } catch (error) {
    console.error("Failed to load ComicInfo.xml:", error);
    return { ok: false as const, error: errorCode(error, "loadError") };
  }
}

export async function saveComicInfo(volumeId: string, xml: string, revision: string) {
  const startedAt = performance.now();
  const user = await verifySession();
  if (!user?.isAdmin) return { ok: false as const, error: "unauthorized" };
  try {
    await parseComicInfoDocument(xml);
  } catch {
    return { ok: false as const, error: "invalidXml" };
  }

  const client = await getPool().connect();
  let original: ComicArchiveSnapshot | undefined;
  let saved: ComicArchiveSnapshot | undefined;
  let filePath: string | undefined;
  let stage = "lock";
  const timings: Record<string, number> = {};
  async function measure<T>(name: string, operation: () => Promise<T>): Promise<T> {
    stage = name;
    const start = performance.now();
    try {
      return await operation();
    } finally {
      timings[name] = Math.round(performance.now() - start);
    }
  }
  try {
    await client.query("BEGIN");
    const result = await client.query<{ full_path: string }>("SELECT full_path FROM library_volumes WHERE id = $1 FOR UPDATE", [volumeId]);
    filePath = result.rows[0]?.full_path;
    if (!filePath || !/\.(cbz|zip|cbr|rar)$/i.test(filePath)) throw new Error("saveError");
    const archivePath = filePath;
    const snapshot = await measure("readMs", () => readStoredComicArchive(archivePath, provider));
    original = snapshot;
    if (original.revision !== revision) throw new Error("conflict");
    const { data, document } = await measure("prepareMs", async () => {
      const data = await writeComicInfoArchive(snapshot.data, xml);
      const document = await parseComicInfoDocument((await readComicInfoArchive(data)).xml);
      return { data, document };
    });
    const persisted = await measure("writeMs", () => writeStoredComicArchive(archivePath, provider, snapshot, data));
    saved = persisted;
    await measure("verifyMs", () => verifyStoredComicArchive(archivePath, provider, persisted));
    await measure("databaseMs", async () => {
      await syncVolumeMetadataAndTaxonomy({ volumeId, filePath: archivePath, ...document }, client);
      await client.query("UPDATE library_volumes SET size = $2, mtime = NOW(), updated_at = NOW() WHERE id = $1", [volumeId, data.length]);
      await client.query("COMMIT");
    });
    console.info("ComicInfo.xml saved:", { volumeId, provider, archiveBytes: data.length, timings, totalMs: Math.round(performance.now() - startedAt), memory: memoryUsage() });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (filePath && original && saved) {
      try {
        await writeStoredComicArchive(filePath, provider, saved, original.data);
      } catch (restoreError) {
        console.error("Failed to restore comic archive:", restoreError);
        return { ok: false as const, error: "restoreError" };
      }
    }
    console.error("Failed to save ComicInfo.xml:", { volumeId, provider, stage, timings, totalMs: Math.round(performance.now() - startedAt), memory: memoryUsage() }, error);
    return { ok: false as const, error: errorCode(error, saved ? "syncError" : "saveError") };
  } finally {
    client.release();
  }
  updateTag(MANGA_LIBRARY_TAG);
  return { ok: true as const };
}
