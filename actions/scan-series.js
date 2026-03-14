"use server";

import { verifySession } from "@/lib/auth/verifySession";
import path from "path";
import fsp from "fs/promises";
import prisma from "@/lib/prisma";
import { extractCoverCbz } from "@/lib/jobs/scan/manga/covers/cbz";
import { extractCoverCbr } from "@/lib/jobs/scan/manga/covers/cbr";
import { extractMetadataCbz } from "@/lib/jobs/scan/manga/meta/cbz";
import { extractMetadataCbr } from "@/lib/jobs/scan/manga/meta/cbr";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";
const TEMP_PATH = path.resolve(process.cwd(), "../temp");

function getCoverExtractor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".cbz" || ext === ".zip") return extractCoverCbz;
  if (ext === ".cbr" || ext === ".rar") return extractCoverCbr;
  return null;
}

function getMetaExtractor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".cbz" || ext === ".zip") return extractMetadataCbz;
  if (ext === ".cbr" || ext === ".rar") return extractMetadataCbr;
  return null;
}

async function processVolumeScan(volume, seriesPath) {
  let coversUpdated = 0;
  let metaUpdated = 0;
  let errors = 0;

  const coverExtractor = getCoverExtractor(volume.fullPath);
  if (coverExtractor) {
    try {
      let outputDir;

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

        await prisma.mangaVolume.update({
          where: { id: volume.id },
          data: { coverImage: coverFilename },
        });

        coversUpdated++;
      }
    } catch (err) {
      console.error(
        `Error extrayendo portada de ${volume.fullPath}:`,
        err.message
      );
      errors++;
    }
  }

  const metaExtractor = getMetaExtractor(volume.fullPath);
  if (metaExtractor) {
    try {
      const result = await metaExtractor(volume.fullPath, LIB_PROVIDER);

      if (result) {
        const { metadata, genres, tags } = result;

        const volumeMeta = await prisma.volumeMetadata.upsert({
          where: { filePath: volume.fullPath },
          update: metadata,
          create: { filePath: volume.fullPath, ...metadata },
        });

        if (volume.metadataId !== volumeMeta.id) {
          await prisma.mangaVolume.update({
            where: { id: volume.id },
            data: { metadataId: volumeMeta.id },
          });
        }

        await prisma.volumeToGenre.deleteMany({
          where: { volumeId: volume.id },
        });

        for (const genreName of genres) {
          const genre = await prisma.genre.upsert({
            where: { name: genreName },
            update: {},
            create: { name: genreName },
          });
          await prisma.volumeToGenre.create({
            data: { volumeId: volume.id, genreId: genre.id },
          });
        }

        await prisma.volumeToTag.deleteMany({
          where: { volumeId: volume.id },
        });

        for (const tagName of tags) {
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
          });
          await prisma.volumeToTag.create({
            data: { volumeId: volume.id, tagId: tag.id },
          });
        }

        metaUpdated++;
      }
    } catch (err) {
      console.error(
        `Error extrayendo metadatos de ${volume.fullPath}:`,
        err.message
      );
      errors++;
    }
  }

  return { coversUpdated, metaUpdated, errors };
}

export async function scanSeries(seriesId) {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized" };
  }

  let _err;
  try {
    const series = await prisma.mangaSeries.findUnique({
      where: { id: seriesId },
      include: {
        volumes: {
          select: {
            id: true,
            slug: true,
            fullPath: true,
            metadataId: true,
          },
        },
      },
    });

    if (!series) {
      return { error: "Serie no encontrada" };
    }

    let coversUpdated = 0;
    let metaUpdated = 0;
    let errors = 0;

    for (const volume of series.volumes) {
      const result = await processVolumeScan(volume, series.path);
      coversUpdated += result.coversUpdated;
      metaUpdated += result.metaUpdated;
      errors += result.errors;
    }

    return {
      success: true,
      coversUpdated,
      metaUpdated,
      errors,
      totalVolumes: series.volumes.length,
    };
  } catch (e) {
    _err = e;
  } finally {
    if (_err) {
      console.error("Error en scanSeries:", _err);
      return { error: "Error al escanear la serie" };
    }
  }
}

export async function scanVolume(volumeId) {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized" };
  }

  let _err;
  try {
    const volume = await prisma.mangaVolume.findUnique({
      where: { id: volumeId },
      select: {
        id: true,
        slug: true,
        fullPath: true,
        metadataId: true,
        series: { select: { path: true } },
      },
    });

    if (!volume) {
      return { error: "Volumen no encontrado" };
    }

    const result = await processVolumeScan(volume, volume.series.path);

    return {
      success: true,
      coversUpdated: result.coversUpdated,
      metaUpdated: result.metaUpdated,
      errors: result.errors,
      totalVolumes: 1,
    };
  } catch (e) {
    _err = e;
  } finally {
    if (_err) {
      console.error("Error en scanVolume:", _err);
      return { error: "Error al escanear el volumen" };
    }
  }
}
