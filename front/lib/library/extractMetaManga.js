import fs from "fs";
import path from "path";
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

export async function extractMetaCbz(filePath) {
  try {
    const zip = new AdmZip(filePath);
    const comicInfoEntry = zip.getEntry("ComicInfo.xml");

    if (!comicInfoEntry) return null;

    const xmlContent = comicInfoEntry.getData().toString("utf8");
    return await parseXmlContent(xmlContent);
  } catch (error) {
    console.error("Error extrayendo metadatos de CBZ:", error);
    return null;
  }
}

export async function extractMetaSeries(folderPath) {
  const xmlPath = path.join(folderPath, "ComicInfo.xml");

  if (!fs.existsSync(xmlPath)) return null;

  try {
    const xmlContent = fs.readFileSync(xmlPath, "utf8");
    return await parseXmlContent(xmlContent);
  } catch (error) {
    console.error("Error leyendo metadatos de serie:", error);
    return null;
  }
}
