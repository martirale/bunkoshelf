import { NextResponse } from "next/server";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import AdmZip from "adm-zip";
import crc from "crc";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const COVERS_DIR = path.resolve(process.cwd(), "public/covers");
const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";
const CHECKSUM_STATUS_PATH = path.join(
  process.cwd(),
  "tmp",
  "checksum-status.json"
);

async function extractCoverImageLocal(cbzPath, outputDir) {
  return new Promise((resolve, reject) => {
    let _err;
    try {
      const zip = new AdmZip(cbzPath);
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

          resolve(path.join("/covers", path.basename(outputDir), filename));
          return;
        }
      }

      _err = new Error("No valid cover image found in the CBZ file.");
    } catch (err) {
      _err = err;
    } finally {
      if (_err) {
        console.error(`Error extracting from ${cbzPath}:`, _err);
        reject(_err);
      }
    }
  });
}

async function extractCoverImageFromR2(fullPath, outputDir) {
  const key = fullPath.replace(/^\//, "");

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
  const response = await fetch(signedUrl);

  if (!response.ok) {
    throw new Error(`Failed to download from R2: ${response.statusText}`);
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

      return path.join("/covers", path.basename(outputDir), filename);
    }
  }

  throw new Error("No valid cover image found in the CBZ file.");
}

export async function POST(request) {
  let updated = 0;
  let errors = 0;
  let _err;

  try {
    const body = await request.json().catch(() => ({}));
    const forceAll = body?.forceAll === true;

    let filesToIndex = [];

    if (forceAll) {
      const volumes = await prisma.mangaVolume.findMany({
        select: { fullPath: true },
      });
      filesToIndex = volumes.map((v) => v.fullPath);
    } else {
      const checksumData = await fsp.readFile(CHECKSUM_STATUS_PATH, "utf-8");
      const parsed = JSON.parse(checksumData);
      filesToIndex = parsed.filesToIndex || [];
    }

    if (filesToIndex.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No hay archivos para extraer portadas",
        volumesUpdated: 0,
        errors: 0,
      });
    }

    const volumes = await prisma.mangaVolume.findMany({
      select: {
        id: true,
        slug: true,
        fullPath: true,
      },
    });

    const volumesToProcess = volumes.filter((volume) =>
      filesToIndex.includes(volume.fullPath)
    );

    for (const volume of volumesToProcess) {
      const coverOutputDir = path.join(COVERS_DIR, volume.slug);

      try {
        const files = await fsp.readdir(coverOutputDir).catch(() => []);
        await Promise.all(
          files.map((file) => fsp.unlink(path.join(coverOutputDir, file)))
        );

        let coverPath;

        if (LIB_PROVIDER === "cloud") {
          coverPath = await extractCoverImageFromR2(
            volume.fullPath,
            coverOutputDir
          );
        } else {
          coverPath = await extractCoverImageLocal(
            volume.fullPath,
            coverOutputDir
          );
        }

        await prisma.mangaVolume.update({
          where: { id: volume.id },
          data: {
            coverImage: coverPath,
          },
        });

        updated++;
        console.log(`Portada extraída: ${volume.fullPath}`);
      } catch (err) {
        console.warn(
          `No se pudo extraer la portada de ${volume.fullPath}:`,
          err.message
        );
        errors++;
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Extracción de portadas completada",
      volumesUpdated: updated,
      errors,
    });
  } catch (err) {
    _err = err;
  } finally {
    if (_err) {
      console.error("Error durante la extracción de portadas:", _err);
      return NextResponse.json(
        { ok: false, error: _err.message },
        { status: 500 }
      );
    }
  }
}
