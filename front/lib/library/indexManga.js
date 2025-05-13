import { scanMangaLibrary } from "./scanManga";
import { extractCoverImage } from "./extractCoverManga";
import prisma from "../prisma";
import path from "path";
import fs from "fs/promises";

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

  for (const entry of entries) {
    if (entry.type === "series") {
      const series = await prisma.mangaSeries.upsert({
        where: { slug: entry.slug },
        update: {
          title: entry.title,
          path: entry.path,
          isOneshot: entry.isOneshot,
          metadata: entry.metadata?.content || null,
          mtime: entry.mtime,
        },
        create: {
          title: entry.title,
          slug: entry.slug,
          path: entry.path,
          isOneshot: entry.isOneshot,
          metadata: entry.metadata?.content || null,
          mtime: entry.mtime,
        },
      });

      for (const vol of entry.volumes) {
        const slug = vol.slug;
        const outputDir = path.join(process.cwd(), "public", "covers", slug);
        const coverPath = await extractCoverImage(vol.fullPath, outputDir);

        await prisma.mangaVolume.upsert({
          where: { slug },
          update: {
            title: vol.filename.replace(/\.cbz$/i, ""),
            filename: vol.filename,
            fullPath: vol.fullPath,
            metadata: vol.metadata?.content || null,
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
            metadata: vol.metadata?.content || null,
            seriesId: series.id,
            mtime: vol.mtime,
            size: vol.size,
            coverImage: coverPath,
          },
        });

        processedSlugs.add(slug);
      }
    } else if (entry.type === "volume") {
      const slug = entry.slug;
      const outputDir = path.join(process.cwd(), "public", "covers", slug);
      const coverPath = await extractCoverImage(entry.fullPath, outputDir);

      await prisma.mangaVolume.upsert({
        where: { slug },
        update: {
          title: entry.title,
          filename: entry.filename,
          fullPath: entry.fullPath,
          metadata: entry.metadata?.content || null,
          seriesId: null,
          mtime: entry.mtime,
          size: entry.size,
          coverImage: coverPath,
        },
        create: {
          title: entry.title,
          slug,
          filename: entry.filename,
          fullPath: entry.fullPath,
          metadata: entry.metadata?.content || null,
          seriesId: null,
          mtime: entry.mtime,
          size: entry.size,
          coverImage: coverPath,
        },
      });

      processedSlugs.add(slug);
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
  const scannedSeriesSlugs = entries
    .filter((entry) => entry.type === "series")
    .map((entry) => entry.slug);

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
