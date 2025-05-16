import { indexMangaLibrary } from "@/lib/library/indexManga";
import { extractMetaManga } from "@/lib/library/extractMetaManga";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Primero ejecutamos el indexado
    await indexMangaLibrary();

    // Luego extraemos y actualizamos metadatos
    const metas = await extractMetaManga({ prisma });

    for (const { id, meta, filePath } of metas) {
      const number = meta.Number?.[0] ? parseFloat(meta.Number[0]) : null;
      const count = meta.Count ? parseInt(meta.Count[0], 10) : null;
      const year = meta.Year ? parseInt(meta.Year[0], 10) : null;
      const month = meta.Month ? parseInt(meta.Month[0], 10) : null;
      const day = meta.Day ? parseInt(meta.Day[0], 10) : null;

      // Upsert metadatos
      const volumeMeta = await prisma.volumeMetadata.upsert({
        where: { filePath },
        update: {
          series: meta.Series?.[0] || null,
          title: meta.Title?.[0] || null,
          number,
          count,
          publisher: meta.Publisher?.[0] || null,
          genre: meta.Genre?.[0] || null,
          languageISO: meta.LanguageISO?.[0] || null,
          ageRating: meta.AgeRating?.[0] || null,
          writer: meta.Writer?.[0] || null,
          penciller: meta.Penciller?.[0] || null,
          inker: meta.Inker?.[0] || null,
          colorist: meta.Colorist?.[0] || null,
          letterer: meta.Letterer?.[0] || null,
          coverArtist: meta.CoverArtist?.[0] || null,
          editor: meta.Editor?.[0] || null,
          translator: meta.Translator?.[0] || null,
          summary: meta.Summary?.[0] || null,
          web: meta.Web?.[0] || null,
          tags: meta.Tags?.[0] || null,
          year,
          month,
          day,
          gtin: meta.GTIN?.[0] || null,
          mangaStyle: meta.MangaStyle?.[0] || null,
        },
        create: {
          filePath,
          series: meta.Series?.[0] || null,
          title: meta.Title?.[0] || null,
          number,
          count,
          publisher: meta.Publisher?.[0] || null,
          genre: meta.Genre?.[0] || null,
          languageISO: meta.LanguageISO?.[0] || null,
          ageRating: meta.AgeRating?.[0] || null,
          writer: meta.Writer?.[0] || null,
          penciller: meta.Penciller?.[0] || null,
          inker: meta.Inker?.[0] || null,
          colorist: meta.Colorist?.[0] || null,
          letterer: meta.Letterer?.[0] || null,
          coverArtist: meta.CoverArtist?.[0] || null,
          editor: meta.Editor?.[0] || null,
          translator: meta.Translator?.[0] || null,
          summary: meta.Summary?.[0] || null,
          web: meta.Web?.[0] || null,
          tags: meta.Tags?.[0] || null,
          year,
          month,
          day,
          gtin: meta.GTIN?.[0] || null,
          mangaStyle: meta.MangaStyle?.[0] || null,
        },
      });

      // Actualizar volumen con el metadataId
      await prisma.mangaVolume.update({
        where: { id },
        data: { metadataId: volumeMeta.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en fullScan:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
