import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { createExtractorFromData } from "node-unrar-js";
import crc from "crc";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import { loadUnrarWasmBinary } from "@/lib/unrar";
import type { StorageProvider } from "@/lib/types";

const wasmBinary = await loadUnrarWasmBinary();

async function extractCoverFromR2(fullPath: string, outputDir: string): Promise<string | null> {
  let error: Error | null = null;

  try {
    const key = fullPath.replace(/^\//, "");

    const response = await r2Client.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key })
    );

    const buffer = Buffer.from(await response.Body!.transformToByteArray());

    const extractor = await createExtractorFromData({
      data: new Uint8Array(buffer).buffer as ArrayBuffer,
      wasmBinary: new Uint8Array(wasmBinary).buffer as ArrayBuffer,
    });
    const list = extractor.getFileList();
    const fileHeaders = [...list.fileHeaders];

    const imageFiles = fileHeaders.filter(
      (header) =>
        !header.name.startsWith("__MACOSX") &&
        /\.(jpg|jpeg|png|webp)$/i.test(header.name)
    );

    if (imageFiles.length === 0) {
      console.warn(`No se encontró imagen de portada válida en: ${fullPath}`);
      return null;
    }

    imageFiles.sort((a, b) => a.name.localeCompare(b.name));

    const firstImage = imageFiles[0];

    await fsp.mkdir(outputDir, { recursive: true });

    const extracted = extractor.extract({ files: [firstImage.name] });
    const files = [...extracted.files];

    if (files.length > 0) {
      const fileData = files[0].extraction!;
      const ext = path.extname(firstImage.name).toLowerCase();
      const hash = crc.crc32(Buffer.from(fileData)).toString(16);

      const filename = `cover-${hash}${ext}`;
      const outputPath = path.join(outputDir, filename);

      await fsp.writeFile(outputPath, fileData);

      return filename;
    }

    console.warn(`No se pudo extraer la primera imagen de: ${fullPath}`);
    return null;
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error(`Error extrayendo portada desde R2: ${fullPath}`, error);
      return null;
    }
  }

  return null;
}

async function extractCoverLocal(filePath: string, outputDir: string): Promise<string | null> {
  let error: Error | null = null;

  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Archivo no encontrado: ${filePath}`);
      return null;
    }

    const buffer = await fsp.readFile(filePath);
    const extractor = await createExtractorFromData({
      data: new Uint8Array(buffer).buffer as ArrayBuffer,
      wasmBinary: new Uint8Array(wasmBinary).buffer as ArrayBuffer,
    });
    const list = extractor.getFileList();
    const fileHeaders = [...list.fileHeaders];

    const imageFiles = fileHeaders.filter(
      (header) =>
        !header.name.startsWith("__MACOSX") &&
        /\.(jpg|jpeg|png|webp)$/i.test(header.name)
    );

    if (imageFiles.length === 0) {
      console.warn(`No se encontró imagen de portada válida en: ${filePath}`);
      return null;
    }

    imageFiles.sort((a, b) => a.name.localeCompare(b.name));

    const firstImage = imageFiles[0];

    await fsp.mkdir(outputDir, { recursive: true });

    const extracted = extractor.extract({ files: [firstImage.name] });
    const files = [...extracted.files];

    if (files.length > 0) {
      const fileData = files[0].extraction!;
      const ext = path.extname(firstImage.name).toLowerCase();
      const hash = crc.crc32(Buffer.from(fileData)).toString(16);

      const filename = `cover-${hash}${ext}`;
      const outputPath = path.join(outputDir, filename);

      await fsp.writeFile(outputPath, fileData);

      return filename;
    }

    console.warn(`No se pudo extraer la primera imagen de: ${filePath}`);
    return null;
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error(`Error extrayendo portada en: ${filePath}`, error);
      return null;
    }
  }

  return null;
}

export async function extractCoverCbr(
  fullPath: string,
  outputDir: string,
  provider: StorageProvider
): Promise<string | null> {
  let error: Error | null = null;

  try {
    if (provider === "cloud") {
      return await extractCoverFromR2(fullPath, outputDir);
    } else {
      return await extractCoverLocal(fullPath, outputDir);
    }
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error(`Error extrayendo portada: ${fullPath}`, error);
      return null;
    }
  }

  return null;
}
