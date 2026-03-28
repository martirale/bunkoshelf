import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import fsp from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { extractMetadataCbz } from "@/lib/jobs/scan/manga/meta/cbz";
import { extractMetadataCbr } from "@/lib/jobs/scan/manga/meta/cbr";
import type { StorageProvider, ComicInfoResult } from "@/lib/types/manga";

const LIB_PROVIDER = (process.env.LIB_PROVIDER || "local") as StorageProvider;
const CHECKSUM_STATUS_PATH = path.join(
  process.cwd(),
  "tmp",
  "checksum-status.json"
);

async function cleanOrphanedGenresAndTags() {
  const orphanedGenres = await prisma.genre.findMany({
    where: {
      volumes: {
        none: {},
      },
    },
  });

  if (orphanedGenres.length > 0) {
    await prisma.genre.deleteMany({
      where: {
        id: {
          in: orphanedGenres.map((g) => g.id),
        },
      },
    });
    console.log(`Eliminados ${orphanedGenres.length} géneros huérfanos`);
  }

  const orphanedTags = await prisma.tag.findMany({
    where: {
      volumes: {
        none: {},
      },
    },
  });

  if (orphanedTags.length > 0) {
    await prisma.tag.deleteMany({
      where: {
        id: {
          in: orphanedTags.map((t) => t.id),
        },
      },
    });
    console.log(`Eliminadas ${orphanedTags.length} etiquetas huérfanas`);
  }
}

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
      const volumes = await prisma.mangaVolume.findMany({
        select: { fullPath: true },
      });
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

    const volumes = await prisma.mangaVolume.findMany({
      select: { id: true, fullPath: true },
    });

    const volumesToProcess = volumes.filter((volume) =>
      filesToIndex.includes(volume.fullPath)
    );

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

        const volumeMeta = await prisma.volumeMetadata.upsert({
          where: { filePath: volume.fullPath },
          update: metadata,
          create: Object.assign({ filePath: volume.fullPath }, metadata),
        });

        const currentVolume = await prisma.mangaVolume.findUnique({
          where: { id: volume.id },
          select: { metadataId: true },
        });

        if (currentVolume!.metadataId !== volumeMeta.id) {
          await prisma.mangaVolume.update({
            where: { id: volume.id },
            data: { metadataId: volumeMeta.id },
          });
        }

        await prisma.volumeToGenre.deleteMany({
          where: { volumeId: volume.id },
        });

        for (const genreName of genres) {
          const genre = await prisma.genre.upsert({
            where: { name: genreName },
            update: {},
            create: { name: genreName },
          });

          await prisma.volumeToGenre.create({
            data: {
              volumeId: volume.id,
              genreId: genre.id,
            },
          });
        }

        await prisma.volumeToTag.deleteMany({
          where: { volumeId: volume.id },
        });

        for (const tagName of tags) {
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
          });

          await prisma.volumeToTag.create({
            data: {
              volumeId: volume.id,
              tagId: tag.id,
            },
          });
        }

        console.log(`Metadatos procesados: ${volume.fullPath}`);
      } catch (volumeError) {
        console.error(
          `Error procesando volumen ${volume.fullPath}:`,
          volumeError
        );
      }
    }

    await cleanOrphanedGenresAndTags();

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
