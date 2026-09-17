"use server";

import { verifySession } from "@/lib/auth/verifySession";
import path from "path";
import fsp from "fs/promises";
import {
  getCoverExtractor,
  getMetadataExtractor,
} from "@/lib/jobs/scan/manga/extractors";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import type { StorageProvider } from "@/lib/types";
import {
  findSeriesWithVolumesById,
  findVolumeWithSeriesPathById,
  type IndexedVolume,
  linkVolumeMetadata,
  replaceVolumeGenres,
  replaceVolumeTags,
  upsertVolumeMetadataRecord,
  upsertVolumeRecord,
} from "@/lib/db/ingestion";
import { revalidateMangaLibraryCache } from "@/lib/mangaLibraryCache";

const LIB_PROVIDER: StorageProvider = (process.env.LIB_PROVIDER as StorageProvider) || "local";
const TEMP_PATH = path.resolve(process.cwd(), "../temp");
const SCAN_CONCURRENCY = 3;

interface VolumeScanResult {
  coversUpdated: number;
  metaUpdated: number;
  errors: number;
}

interface ScanResult {
  success?: boolean;
  error?: string;
  coversUpdated?: number;
  metaUpdated?: number;
  errors?: number;
  totalVolumes?: number;
}

async function processVolumeScan(
  volume: IndexedVolume,
  seriesPath: string
): Promise<VolumeScanResult> {
  let coversUpdated = 0;
  let metaUpdated = 0;
  let errors = 0;

  const coverExtractor = await getCoverExtractor(volume.fullPath);
  if (coverExtractor) {
    try {
      let outputDir: string;

      if (LIB_PROVIDER === "cloud") {
        await fsp.mkdir(TEMP_PATH, { recursive: true });
        outputDir = path.join(TEMP_PATH, `cover-${volume.slug}`);
        await fsp.mkdir(outputDir, { recursive: true });
      } else {
        outputDir = seriesPath;
      }

      const coverFilename = await coverExtractor(
        volume.fullPath,
        outputDir,
        LIB_PROVIDER
      );

      if (coverFilename) {
        if (LIB_PROVIDER === "cloud") {
          const normalizedPath = seriesPath.replace(/^\//, "");
          const coverKey = `${normalizedPath}/${coverFilename}`;
          const coverData = await fsp.readFile(
            path.join(outputDir, coverFilename)
          );

          await r2Client.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: coverKey,
              Body: coverData,
            })
          );

          await fsp.rm(outputDir, { recursive: true, force: true });
        }

        await upsertVolumeRecord({
          slug: volume.slug,
          title: volume.title,
          filename: volume.filename,
          fullPath: volume.fullPath,
          size: volume.size,
          mtime: new Date(),
          coverImage: coverFilename,
          seriesId: volume.seriesId,
        });

        coversUpdated++;
      }
    } catch (err) {
      console.error(
        `Error extrayendo portada de ${volume.fullPath}:`,
        (err as Error).message
      );
      errors++;
    }
  }

  const metaExtractor = await getMetadataExtractor(volume.fullPath);
  if (metaExtractor) {
    try {
      const result = await metaExtractor(volume.fullPath, LIB_PROVIDER);

      if (result) {
        const { metadata, genres, tags } = result;

        const volumeMeta = await upsertVolumeMetadataRecord(
          volume.fullPath,
          metadata
        );

        if (volume.metadataId !== volumeMeta.id) {
          await linkVolumeMetadata(volume.id, volumeMeta.id);
        }

        await replaceVolumeGenres(volume.id, genres);
        await replaceVolumeTags(volume.id, tags);

        metaUpdated++;
      }
    } catch (err) {
      console.error(
        `Error extrayendo metadatos de ${volume.fullPath}:`,
        (err as Error).message
      );
      errors++;
    }
  }

  return { coversUpdated, metaUpdated, errors };
}

export async function scanSeries(seriesId: string): Promise<ScanResult | undefined> {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized" };
  }

  let _err: Error | null = null;
  try {
    const series = await findSeriesWithVolumesById(seriesId);

    if (!series) {
      return { error: "Serie no encontrada" };
    }

    let coversUpdated = 0;
    let metaUpdated = 0;
    let errors = 0;

    for (let index = 0; index < series.volumes.length; index += SCAN_CONCURRENCY) {
      const volumes = series.volumes.slice(index, index + SCAN_CONCURRENCY);
      const results = await Promise.all(
        volumes.map((volume) => processVolumeScan(volume, series.path))
      );

      for (const result of results) {
        coversUpdated += result.coversUpdated;
        metaUpdated += result.metaUpdated;
        errors += result.errors;
      }
    }

    revalidateMangaLibraryCache();

    return {
      success: true,
      coversUpdated,
      metaUpdated,
      errors,
      totalVolumes: series.volumes.length,
    };
  } catch (e) {
    _err = e as Error;
  } finally {
    if (_err) {
      console.error("Error en scanSeries:", _err);
      return { error: "Error al escanear la serie" };
    }
  }
}

export async function scanVolume(volumeId: string): Promise<ScanResult | undefined> {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized" };
  }

  let _err: Error | null = null;
  try {
    const volume = await findVolumeWithSeriesPathById(volumeId);

    if (!volume) {
      return { error: "Volumen no encontrado" };
    }

    const result = await processVolumeScan(volume, volume.seriesPath!);

    revalidateMangaLibraryCache();

    return {
      success: true,
      coversUpdated: result.coversUpdated,
      metaUpdated: result.metaUpdated,
      errors: result.errors,
      totalVolumes: 1,
    };
  } catch (e) {
    _err = e as Error;
  } finally {
    if (_err) {
      console.error("Error en scanVolume:", _err);
      return { error: "Error al escanear el volumen" };
    }
  }
}
