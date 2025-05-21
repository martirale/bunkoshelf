import { scanMangaLibrary } from "./scanManga";
import { extractCoverImage } from "./extractCoverManga";
import prisma from "../prisma";
import path from "path";
import fs from "fs/promises";

// Función para procesar en chunks
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export async function indexMangaLibrary() {
  const entries = await scanMangaLibrary();

  const existingVolumes = await prisma.mangaVolume.findMany({
    select: { slug: true },
  });
  const existingSlugs = existingVolumes.map((v) => v.slug);

  const processedSlugs = new Set();

  const existingSeries = await prisma.mangaSeries.findMany({
    select: { id: true, slug: true },
  });
  const existingSeriesSlugs = existingSeries.map((series) => series.slug);

  const seriesEntries = entries.filter((e) => e.type === "series");

  // Procesar series en chunks de 20
  const seriesChunks = chunkArray(seriesEntries, 20);

  for (const seriesChunk of seriesChunks) {
    for (const entry of seriesChunk) {
      const series = await prisma.mangaSeries.upsert({
        where: { slug: entry.slug },
        update: {
          title: entry.title,
          path: entry.path,
          isOneshot: entry.isOneshot,
          mtime: entry.mtime,
        },
        create: {
          title: entry.title,
          slug: entry.slug,
          path: entry.path,
          isOneshot: entry.isOneshot,
          mtime: entry.mtime,
        },
      });

      // Procesar volúmenes de esta serie en chunks de 20
      const volumeChunks = chunkArray(entry.volumes, 20);

      for (const chunk of volumeChunks) {
        for (const vol of chunk) {
          const slug = vol.slug;
          const outputDir = path.join(process.cwd(), "public", "covers", slug);
          const coverPath = await extractCoverImage(vol.fullPath, outputDir);

          await prisma.mangaVolume.upsert({
            where: { slug },
            update: {
              title: vol.filename.replace(/\.cbz$/i, ""),
              filename: vol.filename,
              fullPath: vol.fullPath,
              seriesId: series.id,
              mtime: vol.mtime,
              size: vol.size,
              coverImage: coverPath,
            },
            create: {
              title: vol.filename.replace(/\.cbz$/i, ""),
              slug,
              filename: vol.filename,
              fullPath: vol.fullPath,
              seriesId: series.id,
              mtime: vol.mtime,
              size: vol.size,
              coverImage: coverPath,
            },
          });

          processedSlugs.add(slug);
        }
      }
    }
  }

  // Eliminar volúmenes que ya no existen
  const slugsToDelete = existingSlugs.filter(
    (slug) => !processedSlugs.has(slug)
  );

  for (const slug of slugsToDelete) {
    await prisma.mangaVolume.delete({
      where: { slug },
    });

    const coverDir = path.join(process.cwd(), "public", "covers", slug);
    await fs.rm(coverDir, { recursive: true, force: true });
  }

  // Eliminar series que ya no existen
  const scannedSeriesSlugs = seriesEntries.map((entry) => entry.slug);

  const seriesToDelete = existingSeriesSlugs.filter(
    (slug) => !scannedSeriesSlugs.includes(slug)
  );

  if (seriesToDelete.length > 0) {
    await prisma.mangaVolume.deleteMany({
      where: {
        seriesId: {
          in: existingSeries
            .filter((series) => seriesToDelete.includes(series.slug))
            .map((series) => series.id),
        },
      },
    });

    await prisma.mangaSeries.deleteMany({
      where: {
        slug: { in: seriesToDelete },
      },
    });
  }
}
