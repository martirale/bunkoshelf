import { createId } from "@paralleldrive/cuid2";
import { execute, query, queryOne } from "./query";
import type { ComicMetadata } from "@/lib/types";

export interface IndexedSeries {
  id: string;
  slug: string;
  title: string;
  path: string;
  isOneshot: boolean;
}

export interface IndexedVolume {
  id: string;
  slug: string;
  title: string;
  filename: string;
  fullPath: string;
  size: number;
  coverImage: string | null;
  metadataId: string | null;
  seriesId: string;
  seriesPath?: string;
}

interface SeriesRow {
  id: string;
  slug: string;
  title: string;
  path: string;
  is_oneshot: boolean;
}

interface VolumeRow {
  id: string;
  slug: string;
  title: string;
  filename: string;
  full_path: string;
  size: number;
  cover_image: string | null;
  metadata_id: string | null;
  series_id: string;
  series_path?: string;
}

function mapSeries(row: SeriesRow): IndexedSeries {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    path: row.path,
    isOneshot: row.is_oneshot,
  };
}

function mapVolume(row: VolumeRow): IndexedVolume {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    filename: row.filename,
    fullPath: row.full_path,
    size: row.size,
    coverImage: row.cover_image,
    metadataId: row.metadata_id,
    seriesId: row.series_id,
    seriesPath: row.series_path,
  };
}

export async function upsertSeriesRecord(input: {
  slug: string;
  title: string;
  path: string;
  isOneshot: boolean;
  mtime: Date;
}): Promise<IndexedSeries> {
  const row = await queryOne<SeriesRow>(
    `
      INSERT INTO manga_series (
        id,
        slug,
        title,
        path,
        is_oneshot,
        mtime
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (slug)
      DO UPDATE SET
        title = EXCLUDED.title,
        path = EXCLUDED.path,
        is_oneshot = EXCLUDED.is_oneshot,
        mtime = EXCLUDED.mtime,
        updated_at = NOW()
      RETURNING id, slug, title, path, is_oneshot
    `,
    [
      createId(),
      input.slug,
      input.title,
      input.path,
      input.isOneshot,
      input.mtime,
    ]
  );

  if (!row) {
    throw new Error("Failed to upsert series");
  }

  return mapSeries(row);
}

export async function upsertVolumeRecord(input: {
  slug: string;
  title: string;
  filename: string;
  fullPath: string;
  size: number;
  mtime: Date;
  coverImage: string | null;
  seriesId: string;
}): Promise<IndexedVolume> {
  const row = await queryOne<VolumeRow>(
    `
      INSERT INTO manga_volumes (
        id,
        slug,
        title,
        filename,
        full_path,
        size,
        mtime,
        cover_image,
        series_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (slug)
      DO UPDATE SET
        title = EXCLUDED.title,
        filename = EXCLUDED.filename,
        full_path = EXCLUDED.full_path,
        size = EXCLUDED.size,
        mtime = EXCLUDED.mtime,
        cover_image = EXCLUDED.cover_image,
        series_id = EXCLUDED.series_id,
        updated_at = NOW()
      RETURNING id, slug, title, filename, full_path, size, cover_image, metadata_id, series_id
    `,
    [
      createId(),
      input.slug,
      input.title,
      input.filename,
      input.fullPath,
      input.size,
      input.mtime,
      input.coverImage,
      input.seriesId,
    ]
  );

  if (!row) {
    throw new Error("Failed to upsert volume");
  }

  return mapVolume(row);
}

export async function upsertVolumeMetadataRecord(
  filePath: string,
  metadata: ComicMetadata
): Promise<{ id: string }> {
  const row = await queryOne<{ id: string }>(
    `
      INSERT INTO volume_metadata (
        id,
        file_path,
        title,
        series,
        number,
        count,
        summary,
        year,
        month,
        day,
        writer,
        penciller,
        inker,
        colorist,
        letterer,
        cover_artist,
        editor,
        publisher,
        imprint,
        web,
        page_count,
        language_iso,
        format,
        manga_style,
        age_rating,
        community_rating,
        gtin
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
      )
      ON CONFLICT (file_path)
      DO UPDATE SET
        title = EXCLUDED.title,
        series = EXCLUDED.series,
        number = EXCLUDED.number,
        count = EXCLUDED.count,
        summary = EXCLUDED.summary,
        year = EXCLUDED.year,
        month = EXCLUDED.month,
        day = EXCLUDED.day,
        writer = EXCLUDED.writer,
        penciller = EXCLUDED.penciller,
        inker = EXCLUDED.inker,
        colorist = EXCLUDED.colorist,
        letterer = EXCLUDED.letterer,
        cover_artist = EXCLUDED.cover_artist,
        editor = EXCLUDED.editor,
        publisher = EXCLUDED.publisher,
        imprint = EXCLUDED.imprint,
        web = EXCLUDED.web,
        page_count = EXCLUDED.page_count,
        language_iso = EXCLUDED.language_iso,
        format = EXCLUDED.format,
        manga_style = EXCLUDED.manga_style,
        age_rating = EXCLUDED.age_rating,
        community_rating = EXCLUDED.community_rating,
        gtin = EXCLUDED.gtin,
        updated_at = NOW()
      RETURNING id
    `,
    [
      createId(),
      filePath,
      metadata.title ?? null,
      metadata.series ?? null,
      metadata.number ?? null,
      metadata.count ?? null,
      metadata.summary ?? null,
      metadata.year ?? null,
      metadata.month ?? null,
      metadata.day ?? null,
      metadata.writer ?? null,
      metadata.penciller ?? null,
      metadata.inker ?? null,
      metadata.colorist ?? null,
      metadata.letterer ?? null,
      metadata.coverArtist ?? null,
      metadata.editor ?? null,
      metadata.publisher ?? null,
      metadata.imprint ?? null,
      metadata.web ?? null,
      metadata.pageCount ?? null,
      metadata.languageISO ?? null,
      metadata.format ?? null,
      metadata.mangaStyle ?? null,
      metadata.ageRating ?? null,
      metadata.communityRating ?? null,
      metadata.gtin ?? null,
    ]
  );

  if (!row) {
    throw new Error("Failed to upsert volume metadata");
  }

  return row;
}

export async function linkVolumeMetadata(
  volumeId: string,
  metadataId: string
): Promise<void> {
  await execute(
    `
      UPDATE manga_volumes
      SET metadata_id = $2,
          updated_at = NOW()
      WHERE id = $1
    `,
    [volumeId, metadataId]
  );
}

async function upsertGenreId(name: string): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `
      INSERT INTO genres (id, name)
      VALUES ($1, $2)
      ON CONFLICT (name)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `,
    [createId(), name]
  );

  if (!row) {
    throw new Error(`Failed to upsert genre: ${name}`);
  }

  return row.id;
}

async function upsertTagId(name: string): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `
      INSERT INTO tags (id, name)
      VALUES ($1, $2)
      ON CONFLICT (name)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `,
    [createId(), name]
  );

  if (!row) {
    throw new Error(`Failed to upsert tag: ${name}`);
  }

  return row.id;
}

export async function replaceVolumeGenres(
  volumeId: string,
  genreNames: string[]
): Promise<void> {
  await execute(
    `
      DELETE FROM volume_to_genres
      WHERE volume_id = $1
    `,
    [volumeId]
  );

  for (const genreName of genreNames) {
    const genreId = await upsertGenreId(genreName);
    await execute(
      `
        INSERT INTO volume_to_genres (id, volume_id, genre_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (volume_id, genre_id)
        DO NOTHING
      `,
      [createId(), volumeId, genreId]
    );
  }
}

export async function replaceVolumeTags(
  volumeId: string,
  tagNames: string[]
): Promise<void> {
  await execute(
    `
      DELETE FROM volume_to_tags
      WHERE volume_id = $1
    `,
    [volumeId]
  );

  for (const tagName of tagNames) {
    const tagId = await upsertTagId(tagName);
    await execute(
      `
        INSERT INTO volume_to_tags (id, volume_id, tag_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (volume_id, tag_id)
        DO NOTHING
      `,
      [createId(), volumeId, tagId]
    );
  }
}

export async function syncVolumeMetadataAndTaxonomy(input: {
  volumeId: string;
  filePath: string;
  metadata: ComicMetadata;
  genres: string[];
  tags: string[];
}): Promise<{ metadataId: string }> {
  const meta = await upsertVolumeMetadataRecord(input.filePath, input.metadata);
  await linkVolumeMetadata(input.volumeId, meta.id);
  await replaceVolumeGenres(input.volumeId, input.genres);
  await replaceVolumeTags(input.volumeId, input.tags);
  return { metadataId: meta.id };
}

export async function upsertFileChecksumRecord(
  filePath: string,
  checksum: string
): Promise<void> {
  await execute(
    `
      INSERT INTO file_checksums (id, file_path, checksum)
      VALUES ($1, $2, $3)
      ON CONFLICT (file_path)
      DO UPDATE SET
        checksum = EXCLUDED.checksum,
        updated_at = NOW()
    `,
    [createId(), filePath, checksum]
  );
}

export async function findFileChecksumRecord(
  filePath: string
): Promise<{ filePath: string; checksum: string | null } | null> {
  const row = await queryOne<{ file_path: string; checksum: string | null }>(
    `
      SELECT file_path, checksum
      FROM file_checksums
      WHERE file_path = $1
      LIMIT 1
    `,
    [filePath]
  );

  if (!row) {
    return null;
  }

  return {
    filePath: row.file_path,
    checksum: row.checksum,
  };
}

export async function listAllVolumePaths(): Promise<
  { fullPath: string; seriesId: string }[]
> {
  const rows = await query<{ full_path: string; series_id: string }>(
    `
      SELECT full_path, series_id
      FROM manga_volumes
    `
  );

  return rows.map((row) => ({
    fullPath: row.full_path,
    seriesId: row.series_id,
  }));
}

export async function listAllChecksumPaths(): Promise<string[]> {
  const rows = await query<{ file_path: string }>(
    `
      SELECT file_path
      FROM file_checksums
    `
  );

  return rows.map((row) => row.file_path);
}

export async function listVolumesForPaths(
  paths: string[]
): Promise<IndexedVolume[]> {
  if (paths.length === 0) {
    return [];
  }

  const rows = await query<VolumeRow>(
    `
      SELECT
        mv.id,
        mv.slug,
        mv.title,
        mv.filename,
        mv.full_path,
        mv.size,
        mv.cover_image,
        mv.metadata_id,
        mv.series_id,
        ms.path AS series_path
      FROM manga_volumes mv
      INNER JOIN manga_series ms ON ms.id = mv.series_id
      WHERE mv.full_path = ANY($1::text[])
    `,
    [paths]
  );

  return rows.map(mapVolume);
}

export async function findSeriesWithVolumesById(
  seriesId: string
): Promise<(IndexedSeries & { volumes: IndexedVolume[] }) | null> {
  const seriesRow = await queryOne<SeriesRow>(
    `
      SELECT id, slug, title, path, is_oneshot
      FROM manga_series
      WHERE id = $1
      LIMIT 1
    `,
    [seriesId]
  );

  if (!seriesRow) {
    return null;
  }

  const volumeRows = await query<VolumeRow>(
    `
      SELECT id, slug, title, filename, full_path, size, cover_image, metadata_id, series_id
      FROM manga_volumes
      WHERE series_id = $1
      ORDER BY title ASC
    `,
    [seriesId]
  );

  return {
    ...mapSeries(seriesRow),
    volumes: volumeRows.map(mapVolume),
  };
}

export async function findVolumeWithSeriesPathById(
  volumeId: string
): Promise<IndexedVolume | null> {
  const row = await queryOne<VolumeRow>(
    `
      SELECT
        mv.id,
        mv.slug,
        mv.title,
        mv.filename,
        mv.full_path,
        mv.size,
        mv.cover_image,
        mv.metadata_id,
        mv.series_id,
        ms.path AS series_path
      FROM manga_volumes mv
      INNER JOIN manga_series ms ON ms.id = mv.series_id
      WHERE mv.id = $1
      LIMIT 1
    `,
    [volumeId]
  );

  return row ? mapVolume(row) : null;
}

export async function findSeriesBySlugBasic(
  slug: string
): Promise<IndexedSeries | null> {
  const row = await queryOne<SeriesRow>(
    `
      SELECT id, slug, title, path, is_oneshot
      FROM manga_series
      WHERE slug = $1
      LIMIT 1
    `,
    [slug]
  );

  return row ? mapSeries(row) : null;
}

export async function findVolumeBySlugBasic(
  slug: string
): Promise<IndexedVolume | null> {
  const row = await queryOne<VolumeRow>(
    `
      SELECT
        mv.id,
        mv.slug,
        mv.title,
        mv.filename,
        mv.full_path,
        mv.size,
        mv.cover_image,
        mv.metadata_id,
        mv.series_id,
        ms.path AS series_path
      FROM manga_volumes mv
      INNER JOIN manga_series ms ON ms.id = mv.series_id
      WHERE mv.slug = $1
      LIMIT 1
    `,
    [slug]
  );

  return row ? mapVolume(row) : null;
}

export async function listVolumeMetadataIdsBySeriesId(
  seriesId: string
): Promise<string[]> {
  const rows = await query<{ metadata_id: string | null }>(
    `
      SELECT metadata_id
      FROM manga_volumes
      WHERE series_id = $1
        AND metadata_id IS NOT NULL
    `,
    [seriesId]
  );

  return rows
    .map((row) => row.metadata_id)
    .filter((value): value is string => Boolean(value));
}

export async function deleteSeriesById(seriesId: string): Promise<void> {
  await execute(
    `
      DELETE FROM manga_series
      WHERE id = $1
    `,
    [seriesId]
  );
}

export async function deleteVolumeById(volumeId: string): Promise<void> {
  await execute(
    `
      DELETE FROM manga_volumes
      WHERE id = $1
    `,
    [volumeId]
  );
}

export async function deleteVolumeMetadataByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await execute(
    `
      DELETE FROM volume_metadata
      WHERE id = ANY($1::text[])
    `,
    [ids]
  );
}

export async function deleteVolumeByFullPath(fullPath: string): Promise<void> {
  await execute(
    `
      DELETE FROM manga_volumes
      WHERE full_path = $1
    `,
    [fullPath]
  );
}

export async function countVolumesBySeriesId(seriesId: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM manga_volumes
      WHERE series_id = $1
    `,
    [seriesId]
  );

  return Number(row?.count ?? "0");
}

export async function deleteFileChecksumsByPaths(paths: string[]): Promise<void> {
  if (paths.length === 0) {
    return;
  }

  await execute(
    `
      DELETE FROM file_checksums
      WHERE file_path = ANY($1::text[])
    `,
    [paths]
  );
}

export async function deleteFileChecksumsByPrefix(prefix: string): Promise<void> {
  await execute(
    `
      DELETE FROM file_checksums
      WHERE file_path LIKE $1
    `,
    [`${prefix}%`]
  );
}

export async function cleanupOrphanedGenresAndTags(): Promise<void> {
  await execute(
    `
      DELETE FROM genres g
      WHERE NOT EXISTS (
        SELECT 1
        FROM volume_to_genres vtg
        WHERE vtg.genre_id = g.id
      )
    `
  );

  await execute(
    `
      DELETE FROM tags t
      WHERE NOT EXISTS (
        SELECT 1
        FROM volume_to_tags vtt
        WHERE vtt.tag_id = t.id
      )
    `
  );
}
