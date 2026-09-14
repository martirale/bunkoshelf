"use server";

import MiniSearch from "minisearch";
import { verifySession } from "@/lib/auth/verifySession";
import { listSeries, listVolumes } from "@/lib/db/library";
import { listBookSearchEntries } from "@/lib/db/books/library";
import { getLibrarySection } from "@/lib/librarySection";
import type { SearchResult } from "@/lib/types";

interface SearchParams {
  query: string;
}

interface SeriesDoc {
  id: string;
  title: string;
  slug: string;
  isOneshot: boolean;
  section: "manga" | "comic" | "others" | "books";
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
  section: "manga" | "comic" | "others" | "books";
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

  const [volumes, seriesList, bookEntries] = await Promise.all([
    listVolumes({
      includeGenres: true,
      includeTags: true,
    }),
    listSeries(),
    listBookSearchEntries(),
  ]);

  const writerBySeriesId = new Map<string, string>();
  const seriesNameById = new Map<string, string>();
  const sectionBySeriesId = new Map<string, "manga" | "comic" | "others">();

  for (const vol of volumes) {
    const writer = vol.metadataObj?.writer?.trim();
    const seriesName = vol.metadataObj?.series?.trim();

    if (writer && !writerBySeriesId.has(vol.seriesId)) {
      writerBySeriesId.set(vol.seriesId, writer);
    }
    if (seriesName && !seriesNameById.has(vol.seriesId)) {
      seriesNameById.set(vol.seriesId, seriesName);
    }
    if (!sectionBySeriesId.has(vol.seriesId)) {
      sectionBySeriesId.set(
        vol.seriesId,
        getLibrarySection(vol.series.librarySection)
      );
    }
  }

  const mangaSeriesDocs: SeriesDoc[] = seriesList.map((s) => ({
    id: `series-${s.id}`,
    title: s.title,
    slug: s.slug,
    isOneshot: s.isOneshot,
    section: sectionBySeriesId.get(s.id) ?? "manga",
    writer: writerBySeriesId.get(s.id) || "",
    series: seriesNameById.get(s.id) || s.title,
  }));

  const bookSeries = new Map<string, { entry: typeof bookEntries[number]; writers: Set<string> }>();

  for (const entry of bookEntries) {
    const current = bookSeries.get(entry.seriesId);
    if (current) {
      if (entry.writer) current.writers.add(entry.writer);
      continue;
    }
    bookSeries.set(entry.seriesId, {
      entry,
      writers: new Set(entry.writer ? [entry.writer] : []),
    });
  }

  const bookSeriesDocs: SeriesDoc[] = Array.from(bookSeries.values()).map(({ entry, writers }) => ({
    id: `book-series-${entry.seriesId}`,
    title: entry.seriesTitle,
    slug: entry.seriesSlug,
    isOneshot: entry.seriesIsOneshot,
    section: entry.librarySection === "books" ? "books" : "others",
    writer: Array.from(writers).join(", "),
    series: entry.seriesTitle,
  }));

  const seriesDocs = [...mangaSeriesDocs, ...bookSeriesDocs];

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
      section: doc.section,
      type: "series",
      title: doc.title,
      slug: doc.slug,
      isOneshot: doc.isOneshot,
      writer: doc.writer,
      series: doc.series,
      score: res.score,
    };
  });

  const mangaVolumeDocs: VolumeDoc[] = volumes.map((vol) => {
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
      section: getLibrarySection(vol.series.librarySection),
      genres: genreNames.join(", "),
      tags: tagNames.join(", "),
    };
  });

  const bookVolumeDocs: VolumeDoc[] = bookEntries.map((entry) => ({
    id: `book-volume-${entry.id}`,
    title: entry.title,
    writer: entry.writer,
    series: entry.seriesTitle,
    slug: entry.slug,
    isOneshot: entry.seriesIsOneshot,
    section: entry.librarySection === "books" ? "books" : "others",
    genres: entry.subjects,
    tags: "",
  }));

  const volumeDocs = [...mangaVolumeDocs, ...bookVolumeDocs];

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
      section: doc.section,
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
