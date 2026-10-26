import { getAdjacentSlugs } from "@/lib/adjacentNavigation";
import { getLibrarySection } from "@/lib/librarySection";
import { listVolumes, type LibrarySeries, type LibraryVolume } from "./library";
import { listBookVolumes, type BookSeries, type BookVolume } from "./books/library";
import { queryOne } from "./query";

export async function resolveLibraryVolumeSeries(volume: LibraryVolume): Promise<LibrarySeries> {
  const logical = await queryOne<LibrarySeries>(`
    SELECT s.id, s.slug, s.title, s.path, s.is_oneshot AS "isOneshot",
      s.is_logical AS "isLogical", s.mtime, s.status,
      s.library_section AS "librarySection", s.created_at AS "createdAt", s.updated_at AS "updatedAt"
    FROM logical_series_members m
    JOIN library_series s ON s.id = m.logical_series_id
    WHERE m.series_id = $1
  `, [volume.seriesId]);
  return logical ?? volume.series;
}

export async function getLibraryVolumeNavigation(volume: LibraryVolume) {
  const series = await resolveLibraryVolumeSeries(volume);
  const volumes = series.isOneshot ? [] : await listVolumes({
    seriesIds: [series.id],
    scope: getLibrarySection(series.librarySection),
  });
  return { series, ...getAdjacentSlugs(volumes, volume.slug) };
}

export async function getBookVolumeNavigation(volume: BookVolume) {
  const logical = volume.series.librarySection === "other"
    ? await queryOne<BookSeries>(`
        SELECT s.id, s.slug, s.title, s.path, s.is_oneshot AS "isOneshot",
          s.is_logical AS "isLogical", s.status, NULL AS "collectionType", s.library_section AS "librarySection"
        FROM library_volumes v
        JOIN logical_series_members m ON m.series_id = v.series_id
        JOIN library_series s ON s.id = m.logical_series_id
        WHERE v.slug = $1 AND s.library_section = 'other'
      `, [volume.slug])
    : await queryOne<BookSeries>(`
        SELECT s.id, s.slug, s.title, s.path, s.is_oneshot AS "isOneshot",
          s.is_logical AS "isLogical", s.status, s.collection_type AS "collectionType", s.library_section AS "librarySection"
        FROM logical_book_series_members m
        JOIN book_series s ON s.id = m.logical_series_id
        WHERE m.series_id = $1
      `, [volume.series.id]);
  const series = logical ?? volume.series;
  const volumes: Array<{ slug: string }> = series.isOneshot ? [] : series.isLogical && series.librarySection === "other"
    ? await listVolumes({ seriesIds: [series.id], scope: "others" })
    : await listBookVolumes({ seriesSlug: series.slug, librarySection: series.librarySection });
  return { series, ...getAdjacentSlugs(volumes, volume.slug) };
}
