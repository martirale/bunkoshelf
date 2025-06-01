import { NextResponse } from "next/server";
import fs from "fs";
import AdmZip from "adm-zip";
import xml2js from "xml2js";
import prisma from "@/lib/prisma";

const parser = new xml2js.Parser();

async function parseXmlContent(xml) {
  try {
    const result = await parser.parseStringPromise(xml);
    return result && result.ComicInfo ? result.ComicInfo : null;
  } catch (error) {
    console.error("Error al parsear XML:", error);
    return null;
  }
}

async function extractMetaCbz(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Archivo no encontrado: ${filePath}`);
      return null;
    }

    const zip = new AdmZip(filePath);
    const comicInfoEntry = zip.getEntry("ComicInfo.xml");

    if (!comicInfoEntry) {
      console.warn(`ComicInfo.xml no encontrado en: ${filePath}`);
      return null;
    }

    const xmlContent = comicInfoEntry.getData().toString("utf8");
    return await parseXmlContent(xmlContent);
  } catch (error) {
    console.error(`Error extrayendo metadatos en: ${filePath}`, error);
    return null;
  }
}

function transformMeta(meta) {
  const getFirst = (field) => (meta[field] && meta[field][0]) || null;

  return {
    series: getFirst("Series"),
    title: getFirst("Title"),
    number: getFirst("Number") ? parseFloat(getFirst("Number")) : null,
    count: getFirst("Count") ? parseInt(getFirst("Count"), 10) : null,
    publisher: getFirst("Publisher"),
    languageISO: getFirst("LanguageISO"),
    ageRating: getFirst("AgeRating"),
    writer: getFirst("Writer"),
    penciller: getFirst("Penciller"),
    inker: getFirst("Inker"),
    colorist: getFirst("Colorist"),
    letterer: getFirst("Letterer"),
    coverArtist: getFirst("CoverArtist"),
    editor: getFirst("Editor"),
    translator: getFirst("Translator"),
    summary: getFirst("Summary"),
    web: getFirst("Web"),
    year: getFirst("Year") ? parseInt(getFirst("Year"), 10) : null,
    month: getFirst("Month") ? parseInt(getFirst("Month"), 10) : null,
    day: getFirst("Day") ? parseInt(getFirst("Day"), 10) : null,
    gtin: getFirst("GTIN"),
    mangaStyle: getFirst("MangaStyle"),
  };
}

export async function POST() {
  try {
    const volumes = await prisma.mangaVolume.findMany({
      select: { id: true, fullPath: true },
    });

    for (const volume of volumes) {
      try {
        const meta = await extractMetaCbz(volume.fullPath);
        if (!meta) {
          console.log(`Saltando volumen sin metadatos: ${volume.fullPath}`);
          continue;
        }

        const transformed = transformMeta(meta);

        const upsertData = {
          series: transformed.series,
          title: transformed.title,
          number: transformed.number,
          count: transformed.count,
          publisher: transformed.publisher,
          languageISO: transformed.languageISO,
          ageRating: transformed.ageRating,
          writer: transformed.writer,
          penciller: transformed.penciller,
          inker: transformed.inker,
          colorist: transformed.colorist,
          letterer: transformed.letterer,
          coverArtist: transformed.coverArtist,
          editor: transformed.editor,
          translator: transformed.translator,
          summary: transformed.summary,
          web: transformed.web,
          year: transformed.year,
          month: transformed.month,
          day: transformed.day,
          gtin: transformed.gtin,
          mangaStyle: transformed.mangaStyle,
        };

        const volumeMeta = await prisma.volumeMetadata.upsert({
          where: { filePath: volume.fullPath },
          update: upsertData,
          create: Object.assign({ filePath: volume.fullPath }, upsertData),
        });

        // Solo actualiza si el metadataId es distinto para evitar writes innecesarios
        const currentVolume = await prisma.mangaVolume.findUnique({
          where: { id: volume.id },
          select: { metadataId: true },
        });

        if (currentVolume.metadataId !== volumeMeta.id) {
          await prisma.mangaVolume.update({
            where: { id: volume.id },
            data: { metadataId: volumeMeta.id },
          });
        }

        // Procesar géneros
        if (meta.Genre && meta.Genre[0]) {
          const genreList = meta.Genre[0]
            .split(/[;,]/)
            .map((g) => g.trim())
            .filter(Boolean);

          for (const genreName of genreList) {
            const genre = await prisma.genre.upsert({
              where: { name: genreName },
              update: {},
              create: { name: genreName },
            });

            await prisma.volumeToGenre.upsert({
              where: {
                volumeId_genreId: {
                  volumeId: volume.id,
                  genreId: genre.id,
                },
              },
              update: {},
              create: {
                volumeId: volume.id,
                genreId: genre.id,
              },
            });
          }
        }

        // Procesar tags
        if (meta.Tags && meta.Tags[0]) {
          const tagList = meta.Tags[0]
            .split(/[;,]/)
            .map((t) => t.trim())
            .filter(Boolean);

          for (const tagName of tagList) {
            const tag = await prisma.tag.upsert({
              where: { name: tagName },
              update: {},
              create: { name: tagName },
            });

            await prisma.volumeToTag.upsert({
              where: {
                volumeId_tagId: {
                  volumeId: volume.id,
                  tagId: tag.id,
                },
              },
              update: {},
              create: {
                volumeId: volume.id,
                tagId: tag.id,
              },
            });
          }
        }

        console.log(`Metadatos actualizados para: ${volume.fullPath}`);
      } catch (volumeError) {
        console.error(
          `Error procesando volumen ${volume.fullPath}:`,
          volumeError
        );
      }
    }

    return NextResponse.json({
      message: "Metadatos escaneados, actualizados y vinculados correctamente.",
    });
  } catch (error) {
    console.error("Error general al escanear metadatos:", error);
    return NextResponse.json(
      { error: "Error interno al escanear metadatos." },
      { status: 500 }
    );
  }
}
