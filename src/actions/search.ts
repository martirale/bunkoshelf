"use server";

import MiniSearch from "minisearch";
import { verifySession } from "@/lib/auth/verifySession";
import { listSeries, listVolumes } from "@/lib/db/library";
import type { SearchResult } from "@/lib/types";

interface SearchParams {
  query: string;
}

interface SeriesDoc {
  id: string;
  title: string;
  slug: string;
  isOneshot: boolean;
  writer: string;
  series: string;
}

interface VolumeDoc {
  id: string;
  title: string;
  writer: string;
  series: string;
  slug: string;
  isOneshot: boolean;
  genres: string;
  tags: string;
}

interface SeriesResult extends SearchResult {
  type: "series";
}

interface VolumeResult extends SearchResult {
  type: "volume";
  genres: string;
  tags: string;
}

export async function searchManga({ query }: SearchParams) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  if (!query?.trim()) {
    return { success: true, data: [] };
  }

  const volumes = await listVolumes({
    includeGenres: true,
    includeTags: true,
  });

  const writerBySeriesId = new Map<string, string>();
  const seriesNameById = new Map<string, string>();

  for (const vol of volumes) {
    const writer = vol.metadataObj?.writer?.trim();
    const seriesName = vol.metadataObj?.series?.trim();

    if (writer && !writerBySeriesId.has(vol.seriesId)) {
      writerBySeriesId.set(vol.seriesId, writer);
    }
    if (seriesName && !seriesNameById.has(vol.seriesId)) {
      seriesNameById.set(vol.seriesId, seriesName);
    }
  }

  const seriesList = await listSeries();

  const seriesDocs: SeriesDoc[] = seriesList.map((s) => ({
    id: `series-${s.id}`,
    title: s.title,
    slug: s.slug,
    isOneshot: s.isOneshot,
    writer: writerBySeriesId.get(s.id) || "",
    series: seriesNameById.get(s.id) || s.title,
  }));

  const seriesMap = new Map<string, SeriesDoc>(seriesDocs.map((s) => [s.id, s]));

  const seriesSearch = new MiniSearch({
    fields: ["title"],
    storeFields: ["id", "title", "slug", "isOneshot", "writer", "series"],
  });

  seriesSearch.addAll(seriesDocs);

  const foundSeries = seriesSearch.search(query, {
    prefix: true,
    fuzzy: 0.2,
  });

  const seriesResults: SeriesResult[] = foundSeries.map((res) => {
    const doc = seriesMap.get(res.id as string)!;
    return {
      id: doc.id,
      type: "series",
      title: doc.title,
      slug: doc.slug,
      isOneshot: doc.isOneshot,
      writer: doc.writer,
      series: doc.series,
      score: res.score,
    };
  });

  const volumeDocs: VolumeDoc[] = volumes.map((vol) => {
    const genreNames = vol.genres
      .map((genre) => genre.name?.trim())
      .filter((name): name is string => Boolean(name));

    const tagNames = vol.tags
      .map((tag) => tag.name?.trim())
      .filter((name): name is string => Boolean(name));

    return {
      id: `volume-${vol.id}`,
      title: vol.metadataObj?.title || "",
      writer: vol.metadataObj?.writer || "",
      series: vol.metadataObj?.series || "",
      slug: vol.slug,
      isOneshot: vol.series?.isOneshot ?? false,
      genres: genreNames.join(", "),
      tags: tagNames.join(", "),
    };
  });

  const volumesMap = new Map<string, VolumeDoc>(volumeDocs.map((doc) => [doc.id, doc]));

  const volumeSearch = new MiniSearch({
    fields: ["title", "writer", "series", "slug", "genres", "tags"],
    storeFields: ["id", "isOneshot"],
  });

  volumeSearch.addAll(volumeDocs);

  const foundVolumes = volumeSearch.search(query, {
    prefix: true,
    fuzzy: 0.2,
  });

  const volumeResults: VolumeResult[] = foundVolumes.map((res) => {
    const doc = volumesMap.get(res.id as string)!;
    return {
      id: doc.id,
      type: "volume",
      title: doc.title,
      writer: doc.writer,
      series: doc.series,
      slug: doc.slug,
      isOneshot: doc.isOneshot,
      score: res.score,
      genres: doc.genres,
      tags: doc.tags,
    };
  });

  const allResults = [...seriesResults, ...volumeResults].sort((a, b) => {
    const getPriority = (item: SeriesResult | VolumeResult): number => {
      if (item.type === "volume" && item.isOneshot) return 0;
      if (item.type === "series") return 1;
      return 2;
    };

    return getPriority(a) - getPriority(b);
  });

  return { success: true, data: allResults };
}
