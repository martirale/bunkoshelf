import { NextResponse, connection } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import fsp from "fs/promises";
import path from "path";
import { extractCoverCbz } from "@/lib/jobs/scan/manga/covers/cbz";
import { extractCoverCbr } from "@/lib/jobs/scan/manga/covers/cbr";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import type { StorageProvider } from "@/lib/types/manga";
import {
  listAllVolumePaths,
  listVolumesForPaths,
  upsertVolumeRecord,
} from "@/lib/db/ingestion";
import { revalidateMangaLibraryCache } from "@/lib/mangaLibraryCache";

const LIB_PROVIDER = (process.env.LIB_PROVIDER || "local") as StorageProvider;
const TEMP_PATH = path.resolve(process.cwd(), "../temp");
const CHECKSUM_STATUS_PATH = path.join(
  process.cwd(),
  "tmp",
  "checksum-status.json"
);

type CoverExtractor = (
  fullPath: string,
  outputDir: string,
  provider: StorageProvider
) => Promise<string | null>;

function getExtractorForFile(filePath: string): CoverExtractor | null {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".cbz" || ext === ".zip") {
    return extractCoverCbz;
  }

  if (ext === ".cbr" || ext === ".rar") {
    return extractCoverCbr;
  }

  return null;
}

export async function POST(request: NextRequest) {
  let updated = 0;
  let errors = 0;
  let _err: Error | undefined;

  try {
    await connection();

    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const forceAll = (body as Record<string, unknown>)?.forceAll === true;

    let filesToIndex: string[] = [];

    if (forceAll) {
      const volumes = await listAllVolumePaths();
      filesToIndex = volumes.map((v) => v.fullPath);
    } else {
      const checksumData = await fsp.readFile(CHECKSUM_STATUS_PATH, "utf-8");
      const parsed = JSON.parse(checksumData) as { filesToIndex?: string[] };
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

    const volumesToProcess = await listVolumesForPaths(filesToIndex);

    await fsp.mkdir(TEMP_PATH, { recursive: true });

    for (const volume of volumesToProcess) {
      try {
        const extractor = getExtractorForFile(volume.fullPath);

        if (!extractor) {
          console.log(`Formato no soportado: ${volume.fullPath}`);
          continue;
        }

        let outputDir: string;

        if (LIB_PROVIDER === "cloud") {
          outputDir = path.join(TEMP_PATH, `cover-${volume.slug}`);
          await fsp.mkdir(outputDir, { recursive: true });
        } else {
          outputDir = volume.seriesPath!;
        }

        const coverFilename = await extractor(
          volume.fullPath,
          outputDir,
          LIB_PROVIDER
        );

        if (!coverFilename) {
          console.warn(`No se pudo extraer portada de: ${volume.fullPath}`);
          errors++;
          continue;
        }

        if (LIB_PROVIDER === "cloud") {
          const seriesPath = volume.seriesPath!.replace(/^\//, "");
          const coverKey = `${seriesPath}/${coverFilename}`;
          const coverData = await fsp.readFile(
            path.join(outputDir, coverFilename)
          );

          await r2Client.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: coverKey,
              Body: coverData,
            })
          );

          await fsp.rm(outputDir, { recursive: true, force: true });
        }

        await upsertVolumeRecord({
          slug: volume.slug,
          title: volume.title,
          filename: volume.filename,
          fullPath: volume.fullPath,
          size: volume.size,
          mtime: new Date(),
          coverImage: coverFilename,
          seriesId: volume.seriesId,
        });

        updated++;
        console.log(`Portada extraída: ${volume.fullPath}`);
      } catch (err) {
        console.warn(
          `No se pudo extraer la portada de ${volume.fullPath}:`,
          (err as Error).message
        );
        errors++;
      }
    }

    revalidateMangaLibraryCache();

    return NextResponse.json({
      ok: true,
      message: "Extracción de portadas completada",
      volumesUpdated: updated,
      errors,
    });
  } catch (err) {
    _err = err as Error;
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
