import { NextResponse, connection } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import fsp from "fs/promises";
import path from "path";
import { extractMetadataCbz } from "@/lib/jobs/scan/manga/meta/cbz";
import { extractMetadataCbr } from "@/lib/jobs/scan/manga/meta/cbr";
import type { StorageProvider, ComicInfoResult } from "@/lib/types/manga";
import {
  cleanupOrphanedGenresAndTags,
  listAllVolumePaths,
  listVolumesForPaths,
  replaceVolumeGenres,
  replaceVolumeTags,
  upsertVolumeMetadataRecord,
  linkVolumeMetadata,
} from "@/lib/db/ingestion";
import { revalidateMangaLibraryCache } from "@/lib/mangaLibraryCache";

const LIB_PROVIDER = (process.env.LIB_PROVIDER || "local") as StorageProvider;
const CHECKSUM_STATUS_PATH = path.join(
  process.cwd(),
  "tmp",
  "checksum-status.json"
);

type MetaExtractor = (
  fullPath: string,
  provider: StorageProvider
) => Promise<ComicInfoResult | null>;

function getExtractorForFile(filePath: string): MetaExtractor | null {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".cbz" || ext === ".zip") {
    return extractMetadataCbz;
  }

  if (ext === ".cbr" || ext === ".rar") {
    return extractMetadataCbr;
  }

  return null;
}

export async function POST(request: NextRequest) {
  let error: Error | null = null;
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
        message: "No hay archivos para extraer metadatos",
      });
    }

    const volumesToProcess = await listVolumesForPaths(filesToIndex);

    for (const volume of volumesToProcess) {
      try {
        const extractor = getExtractorForFile(volume.fullPath);

        if (!extractor) {
          console.log(`Formato no soportado: ${volume.fullPath}`);
          continue;
        }

        const result = await extractor(volume.fullPath, LIB_PROVIDER);

        if (!result) {
          console.log(`Saltando volumen sin metadatos: ${volume.fullPath}`);
          continue;
        }

        const { metadata, genres, tags } = result;

        const volumeMeta = await upsertVolumeMetadataRecord(
          volume.fullPath,
          metadata
        );

        if (volume.metadataId !== volumeMeta.id) {
          await linkVolumeMetadata(volume.id, volumeMeta.id);
        }

        await replaceVolumeGenres(volume.id, genres);
        await replaceVolumeTags(volume.id, tags);

        console.log(`Metadatos procesados: ${volume.fullPath}`);
      } catch (volumeError) {
        console.error(
          `Error procesando volumen ${volume.fullPath}:`,
          volumeError
        );
      }
    }

    await cleanupOrphanedGenresAndTags();
    revalidateMangaLibraryCache();

    return NextResponse.json({
      message: "Metadatos procesados correctamente.",
    });
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error general al procesar metadatos:", error);
      return NextResponse.json(
        { error: "Error interno al procesar metadatos." },
        { status: 500 }
      );
    }
  }
}
