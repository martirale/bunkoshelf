import AdmZip from "adm-zip";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import prisma from "@/lib/prisma"; // Ajusta esta ruta si tu singleton está en otro lugar

const validImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

export async function POST(req) {
  const { slug } = await req.json();

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const volume = await prisma.mangaVolume.findUnique({
    where: { slug },
  });

  if (!volume) {
    return NextResponse.json({ error: "Volume not found" }, { status: 404 });
  }

  const zipPath = volume.fullPath;

  try {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    const entries = zipEntries
      .filter((entry) => {
        const ext = path.extname(entry.entryName).toLowerCase();
        return !entry.isDirectory && validImageExtensions.includes(ext);
      })
      .sort((a, b) =>
        a.entryName.localeCompare(b.entryName, undefined, { numeric: true })
      );

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bunko-reader-"));

    setTimeout(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log("Temp folder deleted:", tempDir);
      } catch (err) {
        console.error("Failed to delete temp folder:", tempDir, err);
      }
    }, 60 * 60 * 1000); // 1 hora

    const imagePaths = await Promise.all(
      entries.map(async (entry) => {
        const imagePath = path.join(tempDir, path.basename(entry.entryName));
        const fileData = entry.getData();
        await fs.writeFile(imagePath, fileData);

        return `/api/reader/tempImage?path=${encodeURIComponent(imagePath)}`;
      })
    );

    return NextResponse.json({ images: imagePaths });
  } catch (err) {
    console.error("ZIP read error:", err);
    return NextResponse.json(
      { error: "Failed to read archive" },
      { status: 500 }
    );
  }
}
