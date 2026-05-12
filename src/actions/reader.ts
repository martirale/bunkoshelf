"use server";

import { verifySession } from "@/lib/auth/verifySession";
import path from "path";
import {
  findVolumeProgress,
} from "@/lib/db/reading";
import {
  findSeriesBySlug,
  findVolumeBySlug,
  type LibraryVolume,
} from "@/lib/db/library";
import { queryOne } from "@/lib/db/query";
import { extractImagesCbz } from "@/lib/reader/manga/cbz";
import { extractImagesCbr } from "@/lib/reader/manga/cbr";
import type { StorageProvider } from "@/lib/types";

type Extractor = (
  volume: LibraryVolume,
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

    const volume = await findVolumeBySlug({ slug });

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

    const volume = await findVolumeBySlug({ slug });

    if (!volume) {
      return { error: "Volume not found", status: 404 };
    }

    const progress = await findVolumeProgress(user.id, volume.id);

    if (!progress) {
      return { lastPage: 0 };
    }

    return {
      lastPage: progress.last_page,
      totalPages: progress.total_pages,
      lastReadAt: progress.last_read_at,
    };
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

    const series = await findSeriesBySlug({
      slug: seriesSlug,
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

    const readCount = await queryOne<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM user_to_volumes
        WHERE user_id = $1
          AND volume_id = ANY($2::text[])
          AND is_read = TRUE
      `,
      [user.id, series.volumes.map((volume) => volume.id)]
    );

    const readVolumes = Number(readCount?.count ?? "0");

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
