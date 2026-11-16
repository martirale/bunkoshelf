import fs from "fs";
import AdmZip from "adm-zip";
import xml2js from "xml2js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import type { StorageProvider, ComicInfoResult } from "@/lib/types";
import { normalizeComicInfoXml } from "@/lib/comicInfoXml";
import { transformComicMetadata, extractGenresAndTags } from "@/lib/comicInfoMetadata";

const parser = new xml2js.Parser({ tagNameProcessors: [xml2js.processors.stripPrefix] });

function findComicInfoEntry(zip: AdmZip) {
  return zip.getEntries().find((entry) => {
    const name = entry.entryName.split(/[\\/]/).pop();
    return !entry.isDirectory && name?.toLowerCase() === "comicinfo.xml";
  });
}

async function parseXmlContent(xml: string): Promise<Record<string, string[]> | null> {
  let error: Error | null = null;

  try {
    const result = await parser.parseStringPromise(normalizeComicInfoXml(xml));
    const comicInfoKey = Object.keys(result).find(
      (key) => key.toLowerCase() === "comicinfo"
    );
    return comicInfoKey ? result[comicInfoKey] : null;
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error al parsear XML:", error);
      return null;
    }
  }

  return null;
}

async function extractMetaFromR2(fullPath: string): Promise<Record<string, string[]> | null> {
  let error: Error | null = null;

  try {
    const key = fullPath.replace(/^\//, "");

    const response = await r2Client.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key })
    );

    const buffer = Buffer.from(await response.Body!.transformToByteArray());
    const zip = new AdmZip(buffer);
    const comicInfoEntry = findComicInfoEntry(zip);

    if (!comicInfoEntry) {
      console.warn(`ComicInfo.xml no encontrado en: ${fullPath}`);
      return null;
    }

    const xmlContent = comicInfoEntry.getData().toString("utf8");
    return await parseXmlContent(xmlContent);
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error(`Error extrayendo metadatos desde R2: ${fullPath}`, error);
      return null;
    }
  }

  return null;
}

async function extractMetaLocal(filePath: string): Promise<Record<string, string[]> | null> {
  let error: Error | null = null;

  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Archivo no encontrado: ${filePath}`);
      return null;
    }

    const zip = new AdmZip(filePath);
    const comicInfoEntry = findComicInfoEntry(zip);

    if (!comicInfoEntry) {
      console.warn(`ComicInfo.xml no encontrado en: ${filePath}`);
      return null;
    }

    const xmlContent = comicInfoEntry.getData().toString("utf8");
    return await parseXmlContent(xmlContent);
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error(`Error extrayendo metadatos en: ${filePath}`, error);
      return null;
    }
  }

  return null;
}

export async function extractMetadataCbz(
  fullPath: string,
  provider: StorageProvider
): Promise<ComicInfoResult | null> {
  let error: Error | null = null;

  try {
    let meta: Record<string, string[]> | null;

    if (provider === "cloud") {
      meta = await extractMetaFromR2(fullPath);
    } else {
      meta = await extractMetaLocal(fullPath);
    }

    if (!meta) {
      return null;
    }

    const transformed = transformComicMetadata(meta);
    const { genres, tags } = extractGenresAndTags(meta);

    return {
      metadata: transformed,
      genres,
      tags,
    };
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error(`Error extrayendo metadatos: ${fullPath}`, error);
      return null;
    }
  }

  return null;
}
