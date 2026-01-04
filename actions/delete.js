"use server";

import { verifySession } from "@/lib/auth/verifySession";
import fs from "fs/promises";
import path from "path";
import { ListObjectsV2Command, DeleteObjectsCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import prisma from "@/lib/prisma";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";

export async function deleteSeries({ slug }) {
  let _err;
  try {
    const user = await verifySession();
    if (!user) {
      return { ok: false, error: "Unauthorized", status: 401 };
    }

    if (!slug) {
      return { ok: false, error: "slug missing", status: 400 };
    }

    const series = await prisma.mangaSeries.findUnique({ where: { slug } });
    if (!series) {
      return { ok: false, error: "series not found", status: 404 };
    }

    const volumes = await prisma.mangaVolume.findMany({
      where: { seriesId: series.id },
      select: { metadataId: true },
    });

    const metadataIds = volumes.map((v) => v.metadataId).filter(Boolean);

    await prisma.mangaSeries.delete({ where: { id: series.id } });

    if (metadataIds.length > 0) {
      await prisma.volumeMetadata.deleteMany({
        where: { id: { in: metadataIds } },
      });
    }

    const seriesPath = series.path;

    if (LIB_PROVIDER === "cloud") {
      const prefix = seriesPath.replace(/^\/+/, "").replace(/\\/g, "/");
      let continuationToken = undefined;
      do {
        const listRes = await r2Client.send(
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
      await prisma.fileChecksum.deleteMany({
        where: { filePath: { startsWith: normalized } },
      });
    } else {
      await fs.rm(seriesPath, { recursive: true, force: true });
      const normalized = seriesPath.startsWith("/")
        ? seriesPath
        : `/${seriesPath.replace(/^\/+/, "")}`;
      await prisma.fileChecksum.deleteMany({
        where: { filePath: { startsWith: normalized } },
      });
    }

    return { ok: true };
  } catch (error) {
    _err = error;
  } finally {
    if (_err) {
      console.error("Error deleting series:", _err);
      return { ok: false, error: _err.message, status: 500 };
    }
  }
}

export async function deleteVolume({ slug }) {
  let _err;
  try {
    const user = await verifySession();
    if (!user) {
      return { ok: false, error: "Unauthorized", status: 401 };
    }

    if (!slug) {
      return { ok: false, error: "slug missing", status: 400 };
    }

    const volume = await prisma.mangaVolume.findUnique({ where: { slug } });
    if (!volume) {
      return { ok: false, error: "volume not found", status: 404 };
    }

    await prisma.mangaVolume.delete({ where: { id: volume.id } });

    if (volume.metadataId) {
      await prisma.volumeMetadata.deleteMany({
        where: { id: volume.metadataId },
      });
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
      await prisma.fileChecksum.deleteMany({ where: { filePath: txtPath } });
    } else {
      await fs.rm(fullPath, { force: true });
      const txtPath = path.join(
        path.dirname(fullPath),
        `${path.parse(fullPath).name}.txt`
      );
      await fs.rm(txtPath, { force: true });
      await prisma.fileChecksum.deleteMany({ where: { filePath: txtPath } });
    }

    if (volume.seriesId) {
      const remaining = await prisma.mangaVolume.count({
        where: { seriesId: volume.seriesId },
      });
      if (remaining === 0) {
        await prisma.mangaSeries.delete({ where: { id: volume.seriesId } });
      }
    }

    return { ok: true };
  } catch (error) {
    _err = error;
  } finally {
    if (_err) {
      console.error("Error deleting volume:", _err);
      return { ok: false, error: _err.message, status: 500 };
    }
  }
}
