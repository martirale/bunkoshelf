import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const LIBRARY_PATH = path.resolve(process.cwd(), "../library/manga");
const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";
const SUPPORTED_EXTENSIONS = [".cbz", ".zip"];

function toSlug(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST() {
  let _err;
  try {
    let seriesCount = 0;
    let volumeCount = 0;

    if (LIB_PROVIDER === "cloud") {
      const prefix = "library/manga/";
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: prefix,
      });

      const response = await r2Client.send(command);
      const seriesMap = new Map();

      if (response.Contents) {
        for (const item of response.Contents) {
          const relativePath = item.Key.replace(prefix, "");
          const parts = relativePath.split("/");

          if (parts.length < 2) continue;

          const seriesName = parts[0];
          const fileName = parts[parts.length - 1];
          const ext = path.extname(fileName).toLowerCase();

          if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

          if (!seriesMap.has(seriesName)) {
            seriesMap.set(seriesName, []);
          }

          seriesMap.get(seriesName).push({
            fileName,
            fullPath: `/${item.Key}`,
            size: item.Size,
            mtime: item.LastModified,
          });
        }
      }

      const volumeSlugsInCloud = new Set();

      for (const [seriesName, volumes] of seriesMap) {
        const isOneshot = seriesName.toLowerCase().includes("[oneshot]");
        const cleanTitle = seriesName.replace("[oneshot]", "").trim();
        const slug = toSlug(cleanTitle);

        const mangaSeries = await prisma.mangaSeries.upsert({
          where: { slug },
          update: {
            title: cleanTitle,
            path: `/${prefix}${seriesName}`,
            isOneshot,
            mtime: new Date(),
          },
          create: {
            title: cleanTitle,
            slug,
            path: `/${prefix}${seriesName}`,
            isOneshot,
            mtime: new Date(),
          },
        });

        seriesCount++;

        for (const vol of volumes) {
          const volSlug = toSlug(
            path.basename(vol.fileName, path.extname(vol.fileName))
          );

          await prisma.mangaVolume.upsert({
            where: { slug: volSlug },
            update: {
              title: path.basename(vol.fileName, path.extname(vol.fileName)),
              filename: vol.fileName,
              fullPath: vol.fullPath,
              size: vol.size,
              mtime: vol.mtime,
              seriesId: mangaSeries.id,
            },
            create: {
              title: path.basename(vol.fileName, path.extname(vol.fileName)),
              slug: volSlug,
              filename: vol.fileName,
              fullPath: vol.fullPath,
              size: vol.size,
              mtime: vol.mtime,
              seriesId: mangaSeries.id,
            },
          });

          volumeCount++;
          volumeSlugsInCloud.add(volSlug);
        }

        const dbVolumes = await prisma.mangaVolume.findMany({
          where: { seriesId: mangaSeries.id },
          select: { id: true, slug: true },
        });

        for (const vol of dbVolumes) {
          if (!volumeSlugsInCloud.has(vol.slug)) {
            await prisma.mangaVolume.delete({ where: { id: vol.id } });
          }
        }
      }

      const cloudSeriesSlugs = new Set([...seriesMap.keys()].map(toSlug));
      const existingSeries = await prisma.mangaSeries.findMany({
        select: { id: true, slug: true },
      });

      for (const series of existingSeries) {
        if (!cloudSeriesSlugs.has(series.slug)) {
          await prisma.mangaSeries.delete({ where: { id: series.id } });
        }
      }
    } else {
      const dirContents = await fs.readdir(LIBRARY_PATH, {
        withFileTypes: true,
      });

      for (const entry of dirContents) {
        if (!entry.isDirectory()) continue;

        const entryPath = path.join(LIBRARY_PATH, entry.name);
        const files = await fs.readdir(entryPath);
        const volumeFiles = files.filter((f) =>
          SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
        );

        if (volumeFiles.length === 0) continue;

        const isOneshot = entry.name.toLowerCase().includes("[oneshot]");
        const cleanTitle = entry.name.replace("[oneshot]", "").trim();
        const slug = toSlug(cleanTitle);
        const stat = await fs.stat(entryPath);

        const mangaSeries = await prisma.mangaSeries.upsert({
          where: { slug },
          update: {
            title: cleanTitle,
            path: entryPath,
            isOneshot,
            mtime: stat.mtime,
          },
          create: {
            title: cleanTitle,
            slug,
            path: entryPath,
            isOneshot,
            mtime: stat.mtime,
          },
        });

        seriesCount++;

        const volumeSlugsInDisk = new Set();

        for (const volFile of volumeFiles) {
          const volPath = path.join(entryPath, volFile);
          const volSlug = toSlug(path.basename(volFile, path.extname(volFile)));
          const volStat = await fs.stat(volPath);

          await prisma.mangaVolume.upsert({
            where: { slug: volSlug },
            update: {
              title: path.basename(volFile, path.extname(volFile)),
              filename: volFile,
              fullPath: volPath,
              size: volStat.size,
              mtime: volStat.mtime,
              seriesId: mangaSeries.id,
            },
            create: {
              title: path.basename(volFile, path.extname(volFile)),
              slug: volSlug,
              filename: volFile,
              fullPath: volPath,
              size: volStat.size,
              mtime: volStat.mtime,
              seriesId: mangaSeries.id,
            },
          });

          volumeCount++;
          volumeSlugsInDisk.add(volFile);
        }

        const dbVolumes = await prisma.mangaVolume.findMany({
          where: { seriesId: mangaSeries.id },
          select: { id: true, filename: true },
        });

        for (const vol of dbVolumes) {
          if (!volumeSlugsInDisk.has(vol.filename)) {
            await prisma.mangaVolume.delete({ where: { id: vol.id } });
          }
        }
      }

      const currentPaths = new Set(
        dirContents
          .filter((e) => e.isDirectory())
          .map((e) => path.join(LIBRARY_PATH, e.name))
      );

      const existingSeries = await prisma.mangaSeries.findMany({
        select: { id: true, path: true },
      });

      for (const series of existingSeries) {
        if (!currentPaths.has(series.path)) {
          await prisma.mangaSeries.delete({ where: { id: series.id } });
        }
      }

      const existingVolumes = await prisma.mangaVolume.findMany({
        select: { id: true, fullPath: true },
      });

      for (const volume of existingVolumes) {
        try {
          await fs.access(volume.fullPath);
        } catch {
          await prisma.mangaVolume.delete({ where: { id: volume.id } });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Biblioteca indexada correctamente",
      seriesCount,
      volumeCount,
    });
  } catch (error) {
    _err = error;
  } finally {
    if (_err) {
      console.error("Error al escanear la biblioteca:", _err);
      return NextResponse.json(
        { ok: false, error: _err.message },
        { status: 500 }
      );
    }
  }
}
