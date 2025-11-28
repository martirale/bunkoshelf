import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import fsp from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { extractCoverCbz } from "@/lib/jobs/scan/manga/covers/cbz";

const COVERS_DIR = path.resolve(process.cwd(), "public/covers");
const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";
const CHECKSUM_STATUS_PATH = path.join(
  process.cwd(),
  "tmp",
  "checksum-status.json"
);

function getExtractorForFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".cbz" || ext === ".zip") {
    return extractCoverCbz;
  }

  return null;
}

export async function POST(request) {
  let updated = 0;
  let errors = 0;
  let _err;

  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

        const extractor = getExtractorForFile(volume.fullPath);

        if (!extractor) {
          console.log(`Formato no soportado: ${volume.fullPath}`);
          continue;
        }

        const coverPath = await extractor(
          volume.fullPath,
          coverOutputDir,
          LIB_PROVIDER
        );

        if (!coverPath) {
          console.warn(`No se pudo extraer portada de: ${volume.fullPath}`);
          errors++;
          continue;
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
