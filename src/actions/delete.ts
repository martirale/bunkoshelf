"use server";

import { verifySession } from "@/lib/auth/verifySession";
import fs from "fs/promises";
import path from "path";
import { ListObjectsV2Command, DeleteObjectsCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import type { StorageProvider } from "@/lib/types";
import {
  countVolumesBySeriesId,
  deleteFileChecksumsByPaths,
  deleteFileChecksumsByPrefix,
  deleteSeriesById,
  deleteVolumeById,
  deleteVolumeMetadataByIds,
  findSeriesBySlugBasic,
  findVolumeBySlugBasic,
  listVolumeMetadataIdsBySeriesId,
} from "@/lib/db/ingestion";

const LIB_PROVIDER: StorageProvider = (process.env.LIB_PROVIDER as StorageProvider) || "local";

interface DeleteBySlugParams {
  slug: string;
}

interface DeleteResult {
  ok: boolean;
  error?: string;
  status?: number;
}

export async function deleteSeries({ slug }: DeleteBySlugParams): Promise<DeleteResult | undefined> {
  let _err: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { ok: false, error: "Unauthorized", status: 401 };
    }

    if (!slug) {
      return { ok: false, error: "slug missing", status: 400 };
    }

    const series = await findSeriesBySlugBasic(slug);
    if (!series) {
      return { ok: false, error: "series not found", status: 404 };
    }

    const metadataIds = await listVolumeMetadataIdsBySeriesId(series.id);

    await deleteSeriesById(series.id);

    if (metadataIds.length > 0) {
      await deleteVolumeMetadataByIds(metadataIds);
    }

    const seriesPath = series.path;

    if (LIB_PROVIDER === "cloud") {
      const prefix = seriesPath.replace(/^\/+/, "").replace(/\\/g, "/");
      let continuationToken: string | undefined = undefined;
      do {
        const listRes: ListObjectsV2CommandOutput = await r2Client.send(
          new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          })
        );
        const contents = listRes.Contents || [];
        if (contents.length > 0) {
          const objects = contents.map((c) => ({ Key: c.Key }));
          await r2Client.send(
            new DeleteObjectsCommand({
              Bucket: R2_BUCKET,
              Delete: { Objects: objects },
            })
          );
        }
        continuationToken = listRes.IsTruncated
          ? listRes.NextContinuationToken
          : undefined;
      } while (continuationToken);
      const normalized = `/${prefix}`;
      await deleteFileChecksumsByPrefix(normalized);
    } else {
      await fs.rm(seriesPath, { recursive: true, force: true });
      const normalized = seriesPath.startsWith("/")
        ? seriesPath
        : `/${seriesPath.replace(/^\/+/, "")}`;
      await deleteFileChecksumsByPrefix(normalized);
    }

    return { ok: true };
  } catch (error) {
    _err = error as Error;
  } finally {
    if (_err) {
      console.error("Error deleting series:", _err);
      return { ok: false, error: _err.message, status: 500 };
    }
  }
}

export async function deleteVolume({ slug }: DeleteBySlugParams): Promise<DeleteResult | undefined> {
  let _err: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { ok: false, error: "Unauthorized", status: 401 };
    }

    if (!slug) {
      return { ok: false, error: "slug missing", status: 400 };
    }

    const volume = await findVolumeBySlugBasic(slug);
    if (!volume) {
      return { ok: false, error: "volume not found", status: 404 };
    }

    await deleteVolumeById(volume.id);

    if (volume.metadataId) {
      await deleteVolumeMetadataByIds([volume.metadataId]);
    }

    const fullPath = volume.fullPath;

    if (LIB_PROVIDER === "cloud") {
      const fileKey = fullPath.replace(/^\/+/, "").replace(/\\/g, "/");
      await r2Client.send(
        new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: fileKey })
      );

      const txtKey = path.posix.join(
        path.posix.dirname(fileKey),
        `${path.parse(fileKey).name}.txt`
      );
      await r2Client.send(
        new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: txtKey })
      );

      const txtPath = `/${txtKey}`;
      await deleteFileChecksumsByPaths([txtPath]);

      if (volume.coverImage && volume.seriesPath) {
        const seriesPath = volume.seriesPath.replace(/^\//, "");
        const coverKey = `${seriesPath}/${volume.coverImage}`;
        await r2Client.send(
          new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: coverKey })
        );
      }
    } else {
      await fs.rm(fullPath, { force: true });
      const txtPath = path.join(
        path.dirname(fullPath),
        `${path.parse(fullPath).name}.txt`
      );
      await fs.rm(txtPath, { force: true });
      await deleteFileChecksumsByPaths([txtPath]);

      if (volume.coverImage && volume.seriesPath) {
        const coverPath = path.join(volume.seriesPath, volume.coverImage);
        await fs.rm(coverPath, { force: true });
      }
    }

    if (volume.seriesId) {
      const remaining = await countVolumesBySeriesId(volume.seriesId);
      if (remaining === 0) {
        await deleteSeriesById(volume.seriesId);
      }
    }

    return { ok: true };
  } catch (error) {
    _err = error as Error;
  } finally {
    if (_err) {
      console.error("Error deleting volume:", _err);
      return { ok: false, error: _err.message, status: 500 };
    }
  }
}
