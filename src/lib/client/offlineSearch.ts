import { getComicTitle } from "../comicTitles.ts";
import type { SearchResult } from "../types/search.ts";
import type { OfflineVolume } from "./offlineLibrary.ts";

export function searchOfflineVolumes(volumes: OfflineVolume[], query: string): SearchResult[] {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return [];

  return volumes
    .filter((volume) => [
      volume.title, volume.seriesTitle, volume.metadata.title, volume.metadata.altTitle,
      volume.metadata.series, volume.metadata.altSeries, volume.metadata.writer,
    ]
      .filter((value): value is string => typeof value === "string")
      .some((value) => value.toLocaleLowerCase().includes(term)))
    .map((volume) => ({
      id: volume.id,
      section: volume.section,
      type: "volume",
      title: getComicTitle({ title: volume.title, altTitle: volume.metadata.altTitle }) || volume.title,
      slug: volume.slug,
      isOneshot: volume.isOneshot,
      writer: typeof volume.metadata.writer === "string" ? volume.metadata.writer : "",
      series: volume.seriesSlug,
      score: 1,
      genres: Array.isArray(volume.metadata.genres) ? volume.metadata.genres.join(", ") : "",
      tags: Array.isArray(volume.metadata.tags) ? volume.metadata.tags.join(", ") : "",
    }));
}
