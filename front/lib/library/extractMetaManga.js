import fs from "fs";
import AdmZip from "adm-zip";
import xml2js from "xml2js";

const parser = new xml2js.Parser();

async function parseXmlContent(xml) {
  try {
    const result = await parser.parseStringPromise(xml);
    return result?.ComicInfo || null;
  } catch (error) {
    console.error("Error al parsear XML:", error);
    return null;
  }
}

async function extractMetaCbz(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Archivo CBZ no encontrado: ${filePath}`);
      return null;
    }

    const zip = new AdmZip(filePath);
    const comicInfoEntry = zip.getEntry("ComicInfo.xml");

    if (!comicInfoEntry) {
      console.warn(`No se encontró ComicInfo.xml en: ${filePath}`);
      return null;
    }

    const xmlContent = comicInfoEntry.getData().toString("utf8");
    return await parseXmlContent(xmlContent);
  } catch (error) {
    console.error("Error extrayendo metadatos de CBZ:", error);
    return null;
  }
}

export async function extractMetaManga({ prisma }) {
  const volumes = await prisma.mangaVolume.findMany({
    select: {
      id: true,
      fullPath: true,
    },
  });

  const metas = [];

  for (const volume of volumes) {
    const meta = await extractMetaCbz(volume.fullPath);
    if (meta) {
      metas.push({
        id: volume.id,
        filePath: volume.fullPath,
        meta,
      });
    }
  }

  return metas;
}
