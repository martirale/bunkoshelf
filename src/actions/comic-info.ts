"use server";

import { updateTag } from "next/cache";
import { verifySession } from "@/lib/auth/verifySession";
import { findVolumeWithSeriesPathById, syncVolumeMetadataAndTaxonomy } from "@/lib/db/ingestion";
import { getPool } from "@/lib/db/pool";
import { readComicInfoArchive, writeComicInfoArchive } from "@/lib/comicInfoArchive";
import { readStoredComicArchive, writeStoredComicArchive, type ComicArchiveSnapshot } from "@/lib/comicInfoStorage";
import { parseComicInfoDocument } from "@/lib/comicInfoDocument";
import { MANGA_LIBRARY_TAG } from "@/lib/mangaLibraryCache";
import type { StorageProvider } from "@/lib/types";

const provider: StorageProvider = process.env.LIB_PROVIDER === "cloud" ? "cloud" : "local";

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
  try {
    await client.query("BEGIN");
    const result = await client.query<{ full_path: string }>("SELECT full_path FROM library_volumes WHERE id = $1 FOR UPDATE", [volumeId]);
    filePath = result.rows[0]?.full_path;
    if (!filePath || !/\.(cbz|zip|cbr|rar)$/i.test(filePath)) throw new Error("saveError");
    original = await readStoredComicArchive(filePath, provider);
    if (original.revision !== revision) throw new Error("conflict");
    const data = await writeComicInfoArchive(original.data, xml);
    saved = await writeStoredComicArchive(filePath, provider, original, data);
    const persisted = await readStoredComicArchive(filePath, provider);
    if (persisted.revision !== saved.revision) throw new Error("conflict");
    const document = await parseComicInfoDocument((await readComicInfoArchive(persisted.data)).xml);
    await syncVolumeMetadataAndTaxonomy({ volumeId, filePath, ...document }, client);
    await client.query("UPDATE library_volumes SET size = $2, mtime = NOW(), updated_at = NOW() WHERE id = $1", [volumeId, data.length]);
    await client.query("COMMIT");
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
    console.error("Failed to save ComicInfo.xml:", error);
    return { ok: false as const, error: errorCode(error, saved ? "syncError" : "saveError") };
  } finally {
    client.release();
  }
  updateTag(MANGA_LIBRARY_TAG);
  return { ok: true as const };
}
