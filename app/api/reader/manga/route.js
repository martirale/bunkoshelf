import AdmZip from "adm-zip";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import prisma from "@/lib/prisma";

const validImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

// Objeto global en memoria para almacenar directorios temporales por volumen
const activeVolumes = new Map();

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
    // Verificar si ya tenemos un directorio temporal activo para el volumen
    if (activeVolumes.has(slug)) {
      const tempDir = await activeVolumes.get(slug);

      // Validar si el directorio aún existe en disco
      try {
        await fs.access(tempDir);
        const imagePaths = await getImagePathsFromDir(tempDir);
        return NextResponse.json({ images: imagePaths });
      } catch (err) {
        // El directorio ya no existe, lo eliminamos del mapa
        activeVolumes.delete(slug);
      }
    }

    // Si no existe, proceder a crear un nuevo directorio temporal
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    const entries = zipEntries
      .filter((entry) => {
        const ext = path.extname(entry.entryName).toLowerCase();
        return !entry.isDirectory && validImageExtensions.includes(ext);
      })
      .sort((a, b) => {
        const normalize = (name) =>
          name
            .split("/")
            .map((segment) =>
              segment.replace(/\d+/g, (num) => num.padStart(10, "0"))
            )
            .join("/");

        const nameA = normalize(a.entryName);
        const nameB = normalize(b.entryName);

        return nameA.localeCompare(nameB);
      });

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bunko-reader-"));

    // Agregar el nuevo directorio a la memoria global
    activeVolumes.set(slug, tempDir);

    setTimeout(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        activeVolumes.delete(slug); // Limpiar el mapa después de la eliminación
        console.log("Temp folder deleted:", tempDir);
      } catch (err) {
        console.error("Failed to delete temp folder:", tempDir, err);
      }
    }, 72 * 60 * 60 * 1000); // 72 horas

    const imagePaths = [];

    let imageCounter = 1;

    for (const entry of entries) {
      const ext = path.extname(entry.entryName).toLowerCase();
      const newName = `${String(imageCounter).padStart(4, "0")}${ext}`;
      const imagePath = path.join(tempDir, newName);
      const fileData = entry.getData();

      await fs.writeFile(imagePath, fileData);
      imagePaths.push(
        `/api/reader/tempImage?path=${encodeURIComponent(imagePath)}`
      );
      imageCounter++;
    }

    return NextResponse.json({ images: imagePaths });
  } catch (err) {
    console.error("ZIP read error:", err);
    return NextResponse.json(
      { error: "Failed to read archive" },
      { status: 500 }
    );
  }
}

// Función para obtener las imágenes desde un directorio temporal existente
async function getImagePathsFromDir(tempDir) {
  const files = await fs.readdir(tempDir);
  return files
    .filter((file) =>
      validImageExtensions.includes(path.extname(file).toLowerCase())
    )
    .map(
      (file) =>
        `/api/reader/tempImage?path=${encodeURIComponent(
          path.join(tempDir, file)
        )}`
    );
}
