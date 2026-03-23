"use server";

import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";
import path from "path";
import { extractImagesCbz } from "@/lib/reader/manga/cbz";
import { extractImagesCbr } from "@/lib/reader/manga/cbr";
import type { MangaVolume } from "@prisma/client";
import type { StorageProvider } from "@/lib/types";

type Extractor = (
  volume: MangaVolume,
  slug: string,
  provider: StorageProvider,
  activeVolumes: Map<string, string>
) => Promise<{ images: string[] }>;

const activeVolumes = new Map<string, string>();
const LIB_PROVIDER = (process.env.LIB_PROVIDER || "local") as StorageProvider;

function getExtractorForFile(filePath: string): Extractor | null {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".cbz" || ext === ".zip") {
    return extractImagesCbz;
  }

  if (ext === ".cbr" || ext === ".rar") {
    return extractImagesCbr;
  }

  return null;
}

export async function getMangaImages({ slug }: { slug: string }) {
  let error: Error | null = null;

  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!slug) {
      return { error: "Missing slug", status: 400 };
    }

    const volume = await prisma.mangaVolume.findUnique({
      where: { slug },
    });

    if (!volume) {
      return { error: "Volume not found", status: 404 };
    }

    const extractor = getExtractorForFile(volume.fullPath);

    if (!extractor) {
      return {
        error: "Unsupported file format",
        status: 400,
      };
    }

    const result = await extractor(volume, slug, LIB_PROVIDER, activeVolumes);

    return result;
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Reader error:", error);
      return {
        error: "Failed to read archive",
        status: 500,
      };
    }
  }
}

export async function getReadingProgress({ slug }: { slug: string }) {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!slug) {
      return { error: "Missing slug", status: 400 };
    }

    const volume = await prisma.mangaVolume.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!volume) {
      return { error: "Volume not found", status: 404 };
    }

    const progress = await prisma.userToVolume.findUnique({
      where: {
        userId_volumeId: {
          userId: user.id,
          volumeId: volume.id,
        },
      },
      select: {
        lastPage: true,
        totalPages: true,
        lastReadAt: true,
      },
    });

    if (!progress) {
      return { lastPage: 0 };
    }

    return progress;
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error fetching progress:", error);
      return { error: "Server error", status: 500 };
    }
  }
}

export async function getSeriesProgress({ seriesSlug }: { seriesSlug: string }) {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!seriesSlug) {
      return { error: "Missing seriesSlug", status: 400 };
    }

    const series = await prisma.mangaSeries.findUnique({
      where: { slug: seriesSlug },
      select: {
        id: true,
        volumes: {
          select: { id: true },
        },
      },
    });

    if (!series) {
      return { error: "Series not found", status: 404 };
    }

    const totalVolumes = series.volumes.length;

    if (totalVolumes === 0) {
      return {
        readVolumes: 0,
        totalVolumes: 0,
      };
    }

    const readVolumes = await prisma.userToVolume.count({
      where: {
        userId: user.id,
        volumeId: {
          in: series.volumes.map((v) => v.id),
        },
        isRead: true,
      },
    });

    return {
      readVolumes,
      totalVolumes,
    };
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error fetching series progress:", error);
      return { error: "Server error", status: 500 };
    }
  }
}
