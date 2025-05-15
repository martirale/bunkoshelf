import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractMetaManga } from "@/lib/library/extractMetaManga";

export async function POST() {
  try {
    const metas = await extractMetaManga({ prisma });

    for (const { id, meta, filePath } of metas) {
      const number = meta.Volume?.[0] ? parseFloat(meta.Volume[0]) : null;
      const count = meta.Count ? parseInt(meta.Count[0], 10) : null;
      const year = meta.Year ? parseInt(meta.Year[0], 10) : null;
      const month = meta.Month ? parseInt(meta.Month[0], 10) : null;
      const day = meta.Day ? parseInt(meta.Day[0], 10) : null;

      // Primero hacemos el upsert del metadato
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

      // Luego actualizamos el volumen para vincularlo con ese metadataId
      await prisma.mangaVolume.update({
        where: { id },
        data: { metadataId: volumeMeta.id },
      });
    }

    return NextResponse.json({
      message: "Metadatos escaneados, actualizados y vinculados correctamente.",
    });
  } catch (error) {
    console.error("Error al escanear metadatos:", error);
    return NextResponse.json(
      { error: "Error interno al escanear metadatos." },
      { status: 500 }
    );
  }
}
