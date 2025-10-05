import { NextResponse } from "next/server";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import AdmZip from "adm-zip";
import crc from "crc";

const COVERS_DIR = path.resolve(process.cwd(), "public/covers");

async function extractCoverImage(cbzPath, outputDir) {
  return new Promise((resolve, reject) => {
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

      reject(new Error("No valid cover image found in the CBZ file."));
    } catch (err) {
      console.error(`Error extracting from ${cbzPath}:`, err);
      reject(err);
    }
  });
}

async function cleanUnusedCoverDirs(validSlugs) {
  try {
    const existingDirs = await fsp.readdir(COVERS_DIR, { withFileTypes: true });

    for (const dirent of existingDirs) {
      if (dirent.isDirectory() && !validSlugs.includes(dirent.name)) {
        const dirPath = path.join(COVERS_DIR, dirent.name);
        await fsp.rm(dirPath, { recursive: true, force: true });
        console.log(`Directorio de portada eliminado: ${dirent.name}`);
      }
    }
  } catch (err) {
    // Si el directorio no existe, no hay problema.
    if (err.code !== "ENOENT") {
      console.error("Error al limpiar directorios de portadas:", err);
    }
  }
}

export async function POST() {
  let updated = 0;
  let errors = 0;

  try {
    const volumes = await prisma.mangaVolume.findMany({
      select: {
        id: true,
        slug: true,
        fullPath: true,
      },
    });

    const validSlugs = volumes.map((v) => v.slug);
    await cleanUnusedCoverDirs(validSlugs);

    for (const volume of volumes) {
      const coverOutputDir = path.join(COVERS_DIR, volume.slug);

      try {
        const files = await fsp.readdir(coverOutputDir).catch(() => []);
        await Promise.all(
          files.map((file) => fsp.unlink(path.join(coverOutputDir, file)))
        );

        const coverPath = await extractCoverImage(
          volume.fullPath,
          coverOutputDir
        );

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
    console.error("Error durante la extracción de portadas:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
