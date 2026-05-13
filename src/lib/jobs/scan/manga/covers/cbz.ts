import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import AdmZip from "adm-zip";
import { crc32 } from "crc";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import type { StorageProvider } from "@/lib/types";

async function extractCoverFromR2(fullPath: string, outputDir: string): Promise<string | null> {
  let error: Error | null = null;

  try {
    const key = fullPath.replace(/^\//, "");

    const response = await r2Client.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key })
    );

    const buffer = Buffer.from(await response.Body!.transformToByteArray());
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      if (
        !entry.entryName.startsWith("__MACOSX") &&
        /\.(jpg|jpeg|png|webp)$/i.test(entry.entryName)
      ) {
        await fsp.mkdir(outputDir, { recursive: true });

        const ext = path.extname(entry.entryName).toLowerCase();
        const fileData = entry.getData();
        const hash = crc32(fileData).toString(16);

        const filename = `cover-${hash}${ext}`;
        const outputPath = path.join(outputDir, filename);

        await fsp.writeFile(outputPath, fileData);

        return filename;
      }
    }

    console.warn(`No se encontró imagen de portada válida en: ${fullPath}`);
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

    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      if (
        !entry.entryName.startsWith("__MACOSX") &&
        /\.(jpg|jpeg|png|webp)$/i.test(entry.entryName)
      ) {
        fs.mkdirSync(outputDir, { recursive: true });

        const ext = path.extname(entry.entryName).toLowerCase();
        const fileData = entry.getData();
        const hash = crc32(fileData).toString(16);

        const filename = `cover-${hash}${ext}`;
        const outputPath = path.join(outputDir, filename);

        fs.writeFileSync(outputPath, fileData);

        return filename;
      }
    }

    console.warn(`No se encontró imagen de portada válida en: ${filePath}`);
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

export async function extractCoverCbz(
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
