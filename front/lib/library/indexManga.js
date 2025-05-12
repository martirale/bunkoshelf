import { scanMangaLibrary } from "./scanManga";
import prisma from "../prisma";

export async function indexMangaLibrary() {
  const entries = await scanMangaLibrary();

  for (const entry of entries) {
    if (entry.type === "series") {
      // Upsert de la serie
      const series = await prisma.mangaSeries.upsert({
        where: { slug: entry.slug },
        update: {
          title: entry.title,
          path: entry.path,
          isOneshot: entry.isOneshot,
          metadata: entry.metadata?.content || null,
        },
        create: {
          title: entry.title,
          slug: entry.slug,
          path: entry.path,
          isOneshot: entry.isOneshot,
          metadata: entry.metadata?.content || null,
        },
      });

      // Upsert de volúmenes dentro de la serie
      for (const vol of entry.volumes) {
        await prisma.mangaVolume.upsert({
          where: { slug: vol.slug },
          update: {
            title: vol.filename.replace(/\.cbz$/i, ""),
            filename: vol.filename,
            fullPath: vol.fullPath,
            metadata: vol.metadata?.content || null,
            seriesId: series.id,
          },
          create: {
            title: vol.filename.replace(/\.cbz$/i, ""),
            slug: vol.slug,
            filename: vol.filename,
            fullPath: vol.fullPath,
            metadata: vol.metadata?.content || null,
            seriesId: series.id,
          },
        });
      }
    } else if (entry.type === "volume") {
      // Volumen suelto (oneshot sin carpeta)
      await prisma.mangaVolume.upsert({
        where: { slug: entry.slug },
        update: {
          title: entry.title,
          filename: entry.filename,
          fullPath: entry.fullPath,
          metadata: entry.metadata?.content || null,
          seriesId: null,
        },
        create: {
          title: entry.title,
          slug: entry.slug,
          filename: entry.filename,
          fullPath: entry.fullPath,
          metadata: entry.metadata?.content || null,
          seriesId: null,
        },
      });
    }
  }
}
