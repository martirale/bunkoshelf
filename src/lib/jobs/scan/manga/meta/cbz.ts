import fs from "fs";
import AdmZip from "adm-zip";
import xml2js from "xml2js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import type { StorageProvider, ComicMetadata, ComicInfoResult } from "@/lib/types";

const parser = new xml2js.Parser();

async function parseXmlContent(xml: string): Promise<Record<string, string[]> | null> {
  let error: Error | null = null;

  try {
    const result = await parser.parseStringPromise(xml);
    return result && result.ComicInfo ? result.ComicInfo : null;
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
    const comicInfoEntry = zip.getEntry("ComicInfo.xml");

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
    const comicInfoEntry = zip.getEntry("ComicInfo.xml");

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

function transformMeta(meta: Record<string, string[]>): ComicMetadata {
  const getFirst = (field: string): string | null =>
    (meta[field] && meta[field][0]) || null;

  return {
    series: getFirst("Series"),
    title: getFirst("Title"),
    number: getFirst("Number") ? parseFloat(getFirst("Number")!) : null,
    count: getFirst("Count") ? parseInt(getFirst("Count")!, 10) : null,
    publisher: getFirst("Publisher"),
    imprint: getFirst("Imprint"),
    languageISO: getFirst("LanguageISO"),
    format: getFirst("Format"),
    ageRating: getFirst("AgeRating"),
    communityRating: getFirst("CommunityRating")
      ? parseFloat(getFirst("CommunityRating")!)
      : null,
    writer: getFirst("Writer"),
    penciller: getFirst("Penciller"),
    inker: getFirst("Inker"),
    colorist: getFirst("Colorist"),
    letterer: getFirst("Letterer"),
    coverArtist: getFirst("CoverArtist"),
    editor: getFirst("Editor"),
    summary: getFirst("Summary"),
    web: getFirst("Web"),
    pageCount: getFirst("PageCount")
      ? parseInt(getFirst("PageCount")!, 10)
      : null,
    year: getFirst("Year") ? parseInt(getFirst("Year")!, 10) : null,
    month: getFirst("Month") ? parseInt(getFirst("Month")!, 10) : null,
    day: getFirst("Day") ? parseInt(getFirst("Day")!, 10) : null,
    gtin: getFirst("GTIN"),
    mangaStyle: getFirst("Manga"),
  };
}

function extractGenresAndTags(meta: Record<string, string[]>): {
  genres: string[];
  tags: string[];
} {
  const genres: string[] = [];
  const tags: string[] = [];

  if (meta.Genre && meta.Genre[0]) {
    const genreList = meta.Genre[0]
      .split(/[;,]/)
      .map((g) => g.trim())
      .filter(Boolean);
    genres.push(...genreList);
  }

  if (meta.Tags && meta.Tags[0]) {
    const tagList = meta.Tags[0]
      .split(/[;,]/)
      .map((t) => t.trim())
      .filter(Boolean);
    tags.push(...tagList);
  }

  return { genres, tags };
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

    const transformed = transformMeta(meta);
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
