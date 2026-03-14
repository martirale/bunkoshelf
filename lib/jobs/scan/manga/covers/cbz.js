import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import AdmZip from "adm-zip";
import crc from "crc";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import r2Client, { R2_BUCKET } from "@/lib/r2";

async function extractCoverFromR2(fullPath, outputDir) {
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
        const hash = crc.crc32(fileData).toString(16);

        const filename = `cover-${hash}${ext}`;
        const outputPath = path.join(outputDir, filename);

        await fsp.writeFile(outputPath, fileData);

        return filename;
      }
    }

    console.warn(`No se encontró imagen de portada válida en: ${fullPath}`);
    return null;
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error(`Error extrayendo portada desde R2: ${fullPath}`, error);
      return null;
    }
  }
}

async function extractCoverLocal(filePath, outputDir) {
  let error = null;

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
        const hash = crc.crc32(fileData).toString(16);

        const filename = `cover-${hash}${ext}`;
        const outputPath = path.join(outputDir, filename);

        fs.writeFileSync(outputPath, fileData);

        return filename;
      }
    }

    console.warn(`No se encontró imagen de portada válida en: ${filePath}`);
    return null;
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error(`Error extrayendo portada en: ${filePath}`, error);
      return null;
    }
  }
}

export async function extractCoverCbz(fullPath, outputDir, provider) {
  let error = null;

  try {
    if (provider === "cloud") {
      return await extractCoverFromR2(fullPath, outputDir);
    } else {
      return await extractCoverLocal(fullPath, outputDir);
    }
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error(`Error extrayendo portada: ${fullPath}`, error);
      return null;
    }
  }
}
