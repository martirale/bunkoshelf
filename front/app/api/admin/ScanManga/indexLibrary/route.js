import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";

const LIBRARY_PATH = path.resolve(process.cwd(), "../library/manga");
const SUPPORTED_EXTENSIONS = [".cbz"];

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
