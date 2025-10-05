import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";

const LIBRARY_PATH = path.resolve(process.cwd(), "../library/manga");
const SUPPORTED_EXTENSIONS = [".cbz", ".zip"];

function toSlug(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST() {
  try {
    const dirContents = await fs.readdir(LIBRARY_PATH, { withFileTypes: true });
    let seriesCount = 0;
    let volumeCount = 0;

    // Paso 1: indexar series y volúmenes válidos
    for (const entry of dirContents) {
      if (!entry.isDirectory()) continue;

      const entryPath = path.join(LIBRARY_PATH, entry.name);
      const files = await fs.readdir(entryPath);
      const volumeFiles = files.filter((f) =>
        SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
      );

      if (volumeFiles.length === 0) continue;

      const isOneshot = entry.name.toLowerCase().includes("[oneshot]");
      const cleanTitle = entry.name.replace("[oneshot]", "").trim();
      const slug = toSlug(cleanTitle);
      const stat = await fs.stat(entryPath);

      const mangaSeries = await prisma.mangaSeries.upsert({
        where: { slug },
        update: {
          title: cleanTitle,
          path: entryPath,
          isOneshot,
          mtime: stat.mtime,
        },
        create: {
          title: cleanTitle,
          slug,
          path: entryPath,
          isOneshot,
          mtime: stat.mtime,
        },
      });

      seriesCount++;

      const volumeSlugsInDisk = new Set();

      for (const volFile of volumeFiles) {
        const volPath = path.join(entryPath, volFile);
        const volSlug = toSlug(path.basename(volFile, path.extname(volFile)));
        const volStat = await fs.stat(volPath);

        await prisma.mangaVolume.upsert({
          where: { slug: volSlug },
          update: {
            title: path.basename(volFile, path.extname(volFile)),
            filename: volFile,
            fullPath: volPath,
            size: volStat.size,
            mtime: volStat.mtime,
            seriesId: mangaSeries.id,
          },
          create: {
            title: path.basename(volFile, path.extname(volFile)),
            slug: volSlug,
            filename: volFile,
            fullPath: volPath,
            size: volStat.size,
            mtime: volStat.mtime,
            seriesId: mangaSeries.id,
          },
        });

        volumeCount++;
        volumeSlugsInDisk.add(volFile);
        console.log(`Volumen indexado: ${volPath}`);
      }

      // Paso 2: Limpia volúmenes que ya no están en disco
      const dbVolumes = await prisma.mangaVolume.findMany({
        where: { seriesId: mangaSeries.id },
        select: { id: true, filename: true },
      });

      for (const vol of dbVolumes) {
        if (!volumeSlugsInDisk.has(vol.filename)) {
          await prisma.mangaVolume.delete({ where: { id: vol.id } });
          console.log(`Volumen eliminado: ${vol.filename}`);
        }
      }
    }

    // Paso 3: Limpia series eliminadas del disco
    const currentPaths = new Set(
      dirContents
        .filter((e) => e.isDirectory())
        .map((e) => path.join(LIBRARY_PATH, e.name))
    );

    const existingSeries = await prisma.mangaSeries.findMany({
      select: { id: true, path: true },
    });

    for (const series of existingSeries) {
      if (!currentPaths.has(series.path)) {
        // Aquí se borra la serie, el cascada se encarga del resto
        await prisma.mangaSeries.delete({ where: { id: series.id } });
        console.log(`Serie eliminada: ${series.path}`);
      }
    }

    // Paso 4: Limpia volúmenes huérfanos cuyo archivo ya no existe
    const existingVolumes = await prisma.mangaVolume.findMany({
      select: { id: true, fullPath: true },
    });

    for (const volume of existingVolumes) {
      try {
        await fs.access(volume.fullPath);
      } catch {
        await prisma.mangaVolume.delete({ where: { id: volume.id } });
        console.log(`Volumen huérfano eliminado: ${volume.fullPath}`);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Biblioteca indexada correctamente",
      seriesCount,
      volumeCount,
    });
  } catch (error) {
    console.error("Error al escanear la biblioteca:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
