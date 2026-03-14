import fsp from "fs/promises";
import fs from "fs";
import path from "path";
import { createExtractorFromData } from "node-unrar-js";
import xml2js from "xml2js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const parser = new xml2js.Parser();

const wasmBinary = await fsp.readFile(
  path.join(process.cwd(), "node_modules/node-unrar-js/esm/js/unrar.wasm")
);

async function parseXmlContent(xml) {
  let error = null;
  let result = null;

  try {
    result = await parser.parseStringPromise(xml);
    return result && result.ComicInfo ? result.ComicInfo : null;
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("Error al parsear XML:", error);
      return null;
    }
  }
}

async function extractMetaFromR2(fullPath) {
  let error = null;

  try {
    const key = fullPath.replace(/^\//, "");

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    const signedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600,
    });
    const response = await fetch(signedUrl, { cache: "no-store" });

    if (!response.ok) {
      console.warn(`No se pudo descargar desde R2: ${fullPath}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extractor = await createExtractorFromData({
      data: buffer,
      wasmBinary,
    });
    const list = extractor.getFileList();
    const fileHeaders = [...list.fileHeaders];

    const comicInfoFile = fileHeaders.find(
      (header) => header.name === "ComicInfo.xml"
    );

    if (!comicInfoFile) {
      console.warn(`ComicInfo.xml no encontrado en: ${fullPath}`);
      return null;
    }

    const extracted = extractor.extract({ files: ["ComicInfo.xml"] });
    const files = [...extracted.files];

    if (files.length === 0) {
      console.warn(`No se pudo extraer ComicInfo.xml de: ${fullPath}`);
      return null;
    }

    const xmlContent = Buffer.from(files[0].extraction).toString("utf8");
    return await parseXmlContent(xmlContent);
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error(`Error extrayendo metadatos desde R2: ${fullPath}`, error);
      return null;
    }
  }
}

async function extractMetaLocal(filePath) {
  let error = null;

  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Archivo no encontrado: ${filePath}`);
      return null;
    }

    const buffer = await fsp.readFile(filePath);
    const extractor = await createExtractorFromData({
      data: buffer,
      wasmBinary,
    });
    const list = extractor.getFileList();
    const fileHeaders = [...list.fileHeaders];

    const comicInfoFile = fileHeaders.find(
      (header) => header.name === "ComicInfo.xml"
    );

    if (!comicInfoFile) {
      console.warn(`ComicInfo.xml no encontrado en: ${filePath}`);
      return null;
    }

    const extracted = extractor.extract({ files: ["ComicInfo.xml"] });
    const files = [...extracted.files];

    if (files.length === 0) {
      console.warn(`No se pudo extraer ComicInfo.xml de: ${filePath}`);
      return null;
    }

    const xmlContent = Buffer.from(files[0].extraction).toString("utf8");
    return await parseXmlContent(xmlContent);
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error(`Error extrayendo metadatos en: ${filePath}`, error);
      return null;
    }
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
    imprint: getFirst("Imprint"),
    languageISO: getFirst("LanguageISO"),
    format: getFirst("Format"),
    ageRating: getFirst("AgeRating"),
    communityRating: getFirst("CommunityRating")
      ? parseFloat(getFirst("CommunityRating"))
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
      ? parseInt(getFirst("PageCount"), 10)
      : null,
    year: getFirst("Year") ? parseInt(getFirst("Year"), 10) : null,
    month: getFirst("Month") ? parseInt(getFirst("Month"), 10) : null,
    day: getFirst("Day") ? parseInt(getFirst("Day"), 10) : null,
    gtin: getFirst("GTIN"),
    mangaStyle: getFirst("Manga"),
  };
}

function extractGenresAndTags(meta) {
  const genres = [];
  const tags = [];

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

export async function extractMetadataCbr(fullPath, provider) {
  let error = null;

  try {
    let meta;

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
    error = err;
  } finally {
    if (error) {
      console.error(`Error extrayendo metadatos: ${fullPath}`, error);
      return null;
    }
  }
}
