"use server";

import MiniSearch from "minisearch";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function searchManga({ query }) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  if (!query?.trim()) {
    return { success: true, data: [] };
  }

  const volumes = await prisma.mangaVolume.findMany({
    include: {
      series: true,
      metadataObj: true,
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  const writerBySeriesId = new Map();
  const seriesNameById = new Map();

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

  const seriesList = await prisma.mangaSeries.findMany();

  const seriesDocs = seriesList.map((s) => ({
    id: `series-${s.id}`,
    title: s.title,
    slug: s.slug,
    isOneshot: s.isOneshot,
    writer: writerBySeriesId.get(s.id) || "",
    series: seriesNameById.get(s.id) || s.title,
  }));

  const seriesMap = new Map(seriesDocs.map((s) => [s.id, s]));

  const seriesSearch = new MiniSearch({
    fields: ["title"],
    storeFields: ["id", "title", "slug", "isOneshot", "writer", "series"],
  });

  seriesSearch.addAll(seriesDocs);

  const foundSeries = seriesSearch.search(query, {
    prefix: true,
    fuzzy: 0.2,
  });

  const seriesResults = foundSeries.map((res) => {
    const doc = seriesMap.get(res.id);
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

  const volumeDocs = volumes.map((vol) => {
    const genreNames = Array.isArray(vol.genres)
      ? vol.genres
          .map((g) => (g.genre?.name ? g.genre.name.trim() : null))
          .filter(Boolean)
      : [];

    const tagNames = Array.isArray(vol.tags)
      ? vol.tags
          .map((t) => (t.tag?.name ? t.tag.name.trim() : null))
          .filter(Boolean)
      : [];

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

  const volumesMap = new Map(volumeDocs.map((doc) => [doc.id, doc]));

  const volumeSearch = new MiniSearch({
    fields: ["title", "writer", "series", "slug", "genres", "tags"],
    storeFields: ["id", "isOneshot"],
  });

  volumeSearch.addAll(volumeDocs);

  const foundVolumes = volumeSearch.search(query, {
    prefix: true,
    fuzzy: 0.2,
  });

  const volumeResults = foundVolumes.map((res) => {
    const doc = volumesMap.get(res.id);
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
    const getPriority = (item) => {
      if (item.type === "volume" && item.isOneshot) return 0;
      if (item.type === "series") return 1;
      return 2;
    };

    return getPriority(a) - getPriority(b);
  });

  return { success: true, data: allResults };
}
