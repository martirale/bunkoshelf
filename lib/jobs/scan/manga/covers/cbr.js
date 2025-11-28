import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { createExtractorFromData } from "node-unrar-js";
import crc from "crc";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const wasmBinary = await fsp.readFile(
  path.join(process.cwd(), "node_modules/node-unrar-js/esm/js/unrar.wasm")
);

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
    const response = await fetch(signedUrl);

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
      const fileData = files[0].extraction;
      const ext = path.extname(firstImage.name).toLowerCase();
      const hash = crc.crc32(fileData).toString(16);

      const filename = `cover-${hash}${ext}`;
      const outputPath = path.join(outputDir, filename);

      await fsp.writeFile(outputPath, fileData);

      return path.join("/covers", path.basename(outputDir), filename);
    }

    console.warn(`No se pudo extraer la primera imagen de: ${fullPath}`);
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

    const buffer = await fsp.readFile(filePath);
    const extractor = await createExtractorFromData({
      data: buffer,
      wasmBinary,
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
      const fileData = files[0].extraction;
      const ext = path.extname(firstImage.name).toLowerCase();
      const hash = crc.crc32(fileData).toString(16);

      const filename = `cover-${hash}${ext}`;
      const outputPath = path.join(outputDir, filename);

      await fsp.writeFile(outputPath, fileData);

      return path.join("/covers", path.basename(outputDir), filename);
    }

    console.warn(`No se pudo extraer la primera imagen de: ${filePath}`);
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

export async function extractCoverCbr(fullPath, outputDir, provider) {
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
