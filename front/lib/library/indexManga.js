import { scanMangaLibrary } from "./scanManga";
import prisma from "../prisma";

export async function indexMangaLibrary() {
  const entries = await scanMangaLibrary();

  // Obtener los slugs de las series que ya existen en la base de datos
  const existingSeries = await prisma.mangaSeries.findMany({
    select: { id: true, slug: true }, // Seleccionamos tanto el id como el slug
  });
  const existingSeriesSlugs = existingSeries.map((series) => series.slug);
  const existingSeriesIds = existingSeries.map((series) => series.id);

  for (const entry of entries) {
    if (entry.type === "series") {
      // Primero actualizamos o creamos la serie
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

      // Actualizamos los volúmenes de la serie
      for (const vol of entry.volumes) {
        await prisma.mangaVolume.upsert({
          where: { slug: vol.slug },
          update: {
            title: vol.filename.replace(/\.cbz$/i, ""),
            filename: vol.filename,
            fullPath: vol.fullPath,
            metadata: vol.metadata?.content || null,
            seriesId: series.id,
            mtime: vol.mtime,
            size: vol.size,
          },
          create: {
            title: vol.filename.replace(/\.cbz$/i, ""),
            slug: vol.slug,
            filename: vol.filename,
            fullPath: vol.fullPath,
            metadata: vol.metadata?.content || null,
            seriesId: series.id,
            mtime: vol.mtime,
            size: vol.size,
          },
        });
      }
    } else if (entry.type === "volume") {
      // Para volúmenes que no están asociados a ninguna serie
      await prisma.mangaVolume.upsert({
        where: { slug: entry.slug },
        update: {
          title: entry.title,
          filename: entry.filename,
          fullPath: entry.fullPath,
          metadata: entry.metadata?.content || null,
          seriesId: null,
          mtime: entry.mtime,
          size: entry.size,
        },
        create: {
          title: entry.title,
          slug: entry.slug,
          filename: entry.filename,
          fullPath: entry.fullPath,
          metadata: entry.metadata?.content || null,
          seriesId: null,
          mtime: entry.mtime,
          size: entry.size,
        },
      });
    }
  }

  // Aquí eliminamos las series que ya no existen en el sistema de archivos
  const scannedSeriesSlugs = entries
    .filter((entry) => entry.type === "series")
    .map((entry) => entry.slug);
  const seriesToDelete = existingSeriesSlugs.filter(
    (slug) => !scannedSeriesSlugs.includes(slug)
  );

  if (seriesToDelete.length > 0) {
    // Primero eliminamos los volúmenes asociados a las series
    await prisma.mangaVolume.deleteMany({
      where: {
        seriesId: {
          in: existingSeries
            .filter((series) => seriesToDelete.includes(series.slug))
            .map((series) => series.id),
        },
      },
    });

    // Luego eliminamos las series
    await prisma.mangaSeries.deleteMany({
      where: {
        slug: { in: seriesToDelete },
      },
    });
  }
}
