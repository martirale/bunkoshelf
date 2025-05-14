import AdmZip from "adm-zip";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import os from "os";

const prisma = new PrismaClient();

// Extensiones válidas de imagen
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
        return (
          !entry.isDirectory && validImageExtensions.includes(ext) // solo imágenes válidas
        );
      })
      .sort((a, b) =>
        a.entryName.localeCompare(b.entryName, undefined, { numeric: true })
      );

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bunko-reader-"));

    setTimeout(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log("🧹 Temp folder deleted:", tempDir);
      } catch (err) {
        console.error("⚠️ Failed to delete temp folder:", tempDir, err);
      }
    }, 15 * 60 * 1000); // 15 minutos

    const writePromises = entries.map(async (entry) => {
      const imagePath = path.join(tempDir, path.basename(entry.entryName));
      const fileData = entry.getData();
      await fs.writeFile(imagePath, fileData);

      // URL accesible vía API
      return `/api/reader/tempImage?path=${encodeURIComponent(imagePath)}`;
    });

    const imagePaths = await Promise.all(writePromises);

    return NextResponse.json({ images: imagePaths });
  } catch (err) {
    console.error("ZIP read error:", err);
    return NextResponse.json(
      { error: "Failed to read archive" },
      { status: 500 }
    );
  }
}
