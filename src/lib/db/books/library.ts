import { createId } from "@paralleldrive/cuid2";
import { buildNaturalSortKey } from "@/lib/naturalSort";
import type { EpubMetadata } from "@/lib/books/types";
import { execute, query, queryOne } from "../query";

export interface BookSeries {
  id: string;
  slug: string;
  title: string;
  path: string;
  isOneshot: boolean;
  status: string;
  collectionType: "series" | "set" | null;
}

export interface BookVolume {
  id: string;
  slug: string;
  title: string;
  filename: string;
  fullPath: string;
  size: number;
  coverImage: string | null;
  number: number | null;
  createdAt: Date;
  series: BookSeries;
  metadata: EpubMetadata & { id: string };
}

interface BookRow {
  volume_id: string;
  volume_slug: string;
  volume_title: string;
  volume_filename: string;
  volume_full_path: string;
  volume_size: string;
  volume_cover_image: string | null;
  volume_number: number | null;
  volume_created_at: Date;
  series_id: string;
  series_slug: string;
  series_title: string;
  series_path: string;
  series_is_oneshot: boolean;
  series_status: string;
  series_collection_type: "series" | "set" | null;
  metadata_id: string;
  metadata_title: string;
  metadata_subtitle: string | null;
  metadata_description: string | null;
  metadata_publisher: string | null;
  metadata_published_at: string | null;
  metadata_language: string | null;
  metadata_rights: string | null;
  metadata_source: string | null;
  metadata_publication_type: string | null;
  metadata_epub_version: "2" | "3" | null;
  metadata_age_rating: string | null;
  metadata_modified_at: string | null;
  metadata_package_path: string;
  metadata_navigation_path: string | null;
  metadata_cover_path: string | null;
  metadata_rendition_layout: "reflowable" | "pre-paginated";
  metadata_rendition_flow: string | null;
  metadata_rendition_orientation: string | null;
  metadata_rendition_spread: string | null;
}

function mapBook(row: BookRow): BookVolume {
  return {
    id: row.volume_id,
    slug: row.volume_slug,
    title: row.volume_title,
    filename: row.volume_filename,
    fullPath: row.volume_full_path,
    size: Number(row.volume_size),
    coverImage: row.volume_cover_image,
    number: row.volume_number,
    createdAt: row.volume_created_at,
    series: {
      id: row.series_id,
      slug: row.series_slug,
      title: row.series_title,
      path: row.series_path,
      isOneshot: row.series_is_oneshot,
      status: row.series_status,
      collectionType: row.series_collection_type,
    },
    metadata: {
      id: row.metadata_id,
      title: row.metadata_title,
      subtitle: row.metadata_subtitle,
      description: row.metadata_description,
      publisher: row.metadata_publisher,
      publishedAt: row.metadata_published_at,
      language: row.metadata_language,
      rights: row.metadata_rights,
      source: row.metadata_source,
      publicationType: row.metadata_publication_type,
      epubVersion: row.metadata_epub_version,
      ageRating: row.metadata_age_rating,
      modifiedAt: row.metadata_modified_at,
      packagePath: row.metadata_package_path,
      navigationPath: row.metadata_navigation_path,
      coverPath: row.metadata_cover_path,
      renditionLayout: row.metadata_rendition_layout,
      renditionFlow: row.metadata_rendition_flow,
      renditionOrientation: row.metadata_rendition_orientation,
      renditionSpread: row.metadata_rendition_spread,
      collection: null,
      identifiers: [],
      people: [],
      subjects: [],
    },
  };
}

const BOOK_SELECT = `
  SELECT bv.id AS volume_id, bv.slug AS volume_slug, bv.title AS volume_title,
    bv.filename AS volume_filename, bv.full_path AS volume_full_path,
    bv.size::text AS volume_size, bv.cover_image AS volume_cover_image, bv.number AS volume_number, bv.created_at AS volume_created_at,
    bs.id AS series_id, bs.slug AS series_slug, bs.title AS series_title, bs.path AS series_path,
    bs.is_oneshot AS series_is_oneshot, bs.status AS series_status, bs.collection_type AS series_collection_type,
    bm.id AS metadata_id, bm.title AS metadata_title, bm.subtitle AS metadata_subtitle,
    bm.description AS metadata_description, bm.publisher AS metadata_publisher,
    bm.published_at AS metadata_published_at, bm.language AS metadata_language,
    bm.rights AS metadata_rights, bm.source AS metadata_source,
    bm.publication_type AS metadata_publication_type, bm.epub_version AS metadata_epub_version,
    bm.age_rating AS metadata_age_rating,
    bm.modified_at AS metadata_modified_at,
    bm.package_path AS metadata_package_path, bm.navigation_path AS metadata_navigation_path,
    bm.cover_path AS metadata_cover_path, bm.rendition_layout AS metadata_rendition_layout,
    bm.rendition_flow AS metadata_rendition_flow, bm.rendition_orientation AS metadata_rendition_orientation,
    bm.rendition_spread AS metadata_rendition_spread
  FROM book_volumes bv
  INNER JOIN book_series bs ON bs.id = bv.series_id
  INNER JOIN book_metadata bm ON bm.volume_id = bv.id`;

async function hydrateMetadata(volume: BookVolume): Promise<BookVolume> {
  const [identifiers, people, subjects] = await Promise.all([
    query<{ value: string; scheme: string | null; is_primary: boolean }>(
      "SELECT value, scheme, is_primary FROM book_identifiers WHERE metadata_id = $1 ORDER BY is_primary DESC, id", [volume.metadata.id]),
    query<{ name: string; role: string | null; kind: "creator" | "contributor"; sort_name: string | null; position: number }>(
      "SELECT name, role, kind, sort_name, position FROM book_people WHERE metadata_id = $1 ORDER BY CASE kind WHEN 'creator' THEN 0 ELSE 1 END, position, id", [volume.metadata.id]),
    query<{ name: string; scheme: string | null }>(
      "SELECT name, scheme FROM book_subjects WHERE metadata_id = $1 ORDER BY name", [volume.metadata.id]),
  ]);
  volume.metadata.identifiers = identifiers.map((item) => ({ value: item.value, scheme: item.scheme, isPrimary: item.is_primary }));
  volume.metadata.people = people.map((item) => ({ name: item.name, role: item.role, kind: item.kind, sortName: item.sort_name, position: item.position }));
  volume.metadata.subjects = subjects;
  return volume;
}

export async function upsertBook(input: {
  seriesTitle: string;
  seriesPath: string;
  isOneshot: boolean;
  collectionType: "series" | "set" | null;
  volumeNumber: number | null;
  seriesSlug: string;
  volumeSlug: string;
  filename: string;
  fullPath: string;
  size: number;
  mtime: Date;
  metadata: EpubMetadata;
}): Promise<BookVolume> {
  const series = await queryOne<{ id: string }>(`
    INSERT INTO book_series (id, slug, title, sort_title, path, is_oneshot, collection_type, mtime)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, sort_title = EXCLUDED.sort_title,
      path = EXCLUDED.path, is_oneshot = EXCLUDED.is_oneshot, collection_type = EXCLUDED.collection_type,
      mtime = EXCLUDED.mtime, updated_at = NOW()
    RETURNING id`, [createId(), input.seriesSlug, input.seriesTitle, buildNaturalSortKey(input.seriesTitle), input.seriesPath, input.isOneshot, input.collectionType, input.mtime]);
  if (!series) throw new Error("Failed to create book series");

  const volume = await queryOne<{ id: string }>(`
    INSERT INTO book_volumes (id, series_id, slug, title, sort_title, filename, full_path, size, mtime, cover_image, number)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (slug) DO UPDATE SET series_id = EXCLUDED.series_id, title = EXCLUDED.title,
      sort_title = EXCLUDED.sort_title, filename = EXCLUDED.filename, full_path = EXCLUDED.full_path,
      size = EXCLUDED.size, mtime = EXCLUDED.mtime, cover_image = EXCLUDED.cover_image,
      number = EXCLUDED.number, updated_at = NOW()
    RETURNING id`, [createId(), series.id, input.volumeSlug, input.metadata.title, buildNaturalSortKey(input.metadata.title), input.filename, input.fullPath, input.size, input.mtime, input.metadata.coverPath, input.volumeNumber]);
  if (!volume) throw new Error("Failed to create book volume");

  const metadata = await queryOne<{ id: string }>(`
    INSERT INTO book_metadata (id, volume_id, title, subtitle, description, publisher, published_at, language, rights, source, publication_type, epub_version, age_rating, modified_at, package_path, navigation_path, cover_path, rendition_layout, rendition_flow, rendition_orientation, rendition_spread)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
    ON CONFLICT (volume_id) DO UPDATE SET title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, description=EXCLUDED.description,
      publisher=EXCLUDED.publisher, published_at=EXCLUDED.published_at, language=EXCLUDED.language, rights=EXCLUDED.rights,
      source=EXCLUDED.source, publication_type=EXCLUDED.publication_type, epub_version=EXCLUDED.epub_version,
      age_rating=EXCLUDED.age_rating,
      modified_at=EXCLUDED.modified_at,
      package_path=EXCLUDED.package_path, navigation_path=EXCLUDED.navigation_path, cover_path=EXCLUDED.cover_path,
      rendition_layout=EXCLUDED.rendition_layout, rendition_flow=EXCLUDED.rendition_flow,
      rendition_orientation=EXCLUDED.rendition_orientation, rendition_spread=EXCLUDED.rendition_spread, updated_at=NOW()
    RETURNING id`, [createId(), volume.id, input.metadata.title, input.metadata.subtitle, input.metadata.description,
    input.metadata.publisher, input.metadata.publishedAt, input.metadata.language, input.metadata.rights, input.metadata.source,
    input.metadata.publicationType, input.metadata.epubVersion, input.metadata.ageRating, input.metadata.modifiedAt, input.metadata.packagePath,
    input.metadata.navigationPath, input.metadata.coverPath, input.metadata.renditionLayout, input.metadata.renditionFlow,
    input.metadata.renditionOrientation, input.metadata.renditionSpread]);
  if (!metadata) throw new Error("Failed to save book metadata");

  await Promise.all([
    execute("DELETE FROM book_identifiers WHERE metadata_id = $1", [metadata.id]),
    execute("DELETE FROM book_people WHERE metadata_id = $1", [metadata.id]),
    execute("DELETE FROM book_subjects WHERE metadata_id = $1", [metadata.id]),
  ]);
  await Promise.all([
    ...input.metadata.identifiers.map((item) => execute(
      "INSERT INTO book_identifiers (id, metadata_id, value, scheme, is_primary) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (metadata_id, value) DO NOTHING",
      [createId(), metadata.id, item.value, item.scheme, item.isPrimary])),
    ...input.metadata.people.map((item) => execute(
      "INSERT INTO book_people (id, metadata_id, name, role, kind, sort_name, position) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [createId(), metadata.id, item.name, item.role, item.kind, item.sortName, item.position])),
    ...input.metadata.subjects.map((item) => execute(
      "INSERT INTO book_subjects (id, metadata_id, name, scheme) VALUES ($1,$2,$3,$4) ON CONFLICT (metadata_id, name) DO NOTHING",
      [createId(), metadata.id, item.name, item.scheme])),
  ]);
  await execute(`DELETE FROM book_series
    WHERE id <> $1 AND NOT EXISTS (SELECT 1 FROM book_volumes WHERE book_volumes.series_id = book_series.id)`, [series.id]);
  const result = await findBookVolumeBySlug(input.volumeSlug);
  if (!result) throw new Error("Failed to read indexed book");
  return result;
}

export async function findBookVolumeBySlug(slug: string): Promise<BookVolume | null> {
  const row = await queryOne<BookRow>(`${BOOK_SELECT} WHERE bv.slug = $1 LIMIT 1`, [slug]);
  return row ? hydrateMetadata(mapBook(row)) : null;
}

export async function findBookFileBySlug(slug: string): Promise<{ filename: string; fullPath: string } | null> {
  const row = await queryOne<{ filename: string; full_path: string }>(
    "SELECT filename, full_path FROM book_volumes WHERE slug = $1 LIMIT 1",
    [slug],
  );
  return row ? { filename: row.filename, fullPath: row.full_path } : null;
}

export async function listBookVolumes(options?: {
  seriesSlug?: string;
  authorNames?: string[];
  limit?: number;
}): Promise<BookVolume[]> {
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (options?.seriesSlug) {
    params.push(options.seriesSlug);
    conditions.push(`bs.slug = $${params.length}`);
  }

  if (options?.authorNames && options.authorNames.length > 0) {
    params.push(options.authorNames);
    const authorParam = params.length;
    conditions.push(`
      (
        EXISTS (
          SELECT 1
          FROM book_people bp
          WHERE bp.metadata_id = bm.id
            AND bp.kind = 'creator'
            AND (bp.role IS NULL OR LOWER(bp.role) = 'aut')
            AND BTRIM(bp.name) = ANY($${authorParam}::text[])
        )
        OR (
          '__unknown__' = ANY($${authorParam}::text[])
          AND NOT EXISTS (
            SELECT 1
            FROM book_people bp
            WHERE bp.metadata_id = bm.id
              AND bp.kind = 'creator'
              AND (bp.role IS NULL OR LOWER(bp.role) = 'aut')
              AND BTRIM(bp.name) <> ''
          )
        )
      )
    `);
  }

  const where = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  const limit = options?.limit ?? 100;
  params.push(limit);
  const rows = await query<BookRow>(`${BOOK_SELECT}${where} ORDER BY bs.sort_title, bv.number NULLS LAST, bv.sort_title LIMIT $${params.length}`, params);
  return Promise.all(rows.map((row) => hydrateMetadata(mapBook(row))));
}

export async function listRecentlyAddedBooks(limit = 8): Promise<BookVolume[]> {
  const rows = await query<BookRow>(`${BOOK_SELECT} ORDER BY bv.created_at DESC LIMIT $1`, [limit]);
  return Promise.all(rows.map((row) => hydrateMetadata(mapBook(row))));
}

export async function listFavoriteBookSeries(userId: string, options: { page: number; pageSize: number }) {
  const count = await queryOne<{ count: string }>(`
    SELECT COUNT(*)::text AS count
    FROM user_to_book_series ubs
    WHERE ubs.user_id = $1 AND ubs.is_favorite = TRUE`, [userId]);
  const total = Number(count?.count ?? "0");
  const offset = Math.max(0, options.page - 1) * options.pageSize;
  const series = await query<BookSeries>(`
    SELECT bs.id, bs.slug, bs.title, bs.path, bs.is_oneshot AS "isOneshot", bs.status,
      bs.collection_type AS "collectionType"
    FROM book_series bs
    INNER JOIN user_to_book_series ubs ON ubs.series_id = bs.id
    WHERE ubs.user_id = $1 AND ubs.is_favorite = TRUE
    ORDER BY bs.sort_title
    LIMIT $2 OFFSET $3`, [userId, options.pageSize, offset]);
  const items = await Promise.all(series.map(async (entry) => ({
    ...entry,
    volumes: await listBookVolumes({ seriesSlug: entry.slug, limit: 100 }),
  })));

  return { items, total, totalPages: Math.max(1, Math.ceil(total / options.pageSize)) };
}

export async function listFavoriteBookVolumes(userId: string, options: { page: number; pageSize: number }) {
  const count = await queryOne<{ count: string }>(`
    SELECT COUNT(*)::text AS count
    FROM user_to_books
    WHERE user_id = $1 AND is_favorite = TRUE`, [userId]);
  const total = Number(count?.count ?? "0");
  const offset = Math.max(0, options.page - 1) * options.pageSize;
  const rows = await query<BookRow>(`${BOOK_SELECT}
    INNER JOIN user_to_books ub ON ub.volume_id = bv.id
    WHERE ub.user_id = $1 AND ub.is_favorite = TRUE
    ORDER BY bs.sort_title, bv.number NULLS LAST, bv.sort_title
    LIMIT $2 OFFSET $3`, [userId, options.pageSize, offset]);
  const items = await Promise.all(rows.map((row) => hydrateMetadata(mapBook(row))));

  return { items, total, totalPages: Math.max(1, Math.ceil(total / options.pageSize)) };
}

export async function listBooksInProgress(userId: string, limit = 12): Promise<Array<BookVolume & { progression: number; lastReadAt: Date | null }>> {
  const select = BOOK_SELECT.replace("  FROM book_volumes", "  , ub.progression, ub.last_read_at\n  FROM book_volumes");
  const rows = await query<BookRow & { progression: number; last_read_at: Date | null }>(`${select}
    INNER JOIN user_to_books ub ON ub.volume_id = bv.id
    WHERE ub.user_id = $1 AND ub.cfi IS NOT NULL AND ub.is_read = FALSE
    ORDER BY ub.last_read_at DESC NULLS LAST LIMIT $2`, [userId, limit]);
  const books = await Promise.all(rows.map((row) => hydrateMetadata(mapBook(row))));
  return books.map((book, index) => ({
    ...book,
    progression: Number(rows[index].progression ?? 0),
    lastReadAt: rows[index].last_read_at,
  }));
}

export async function listBookProgressByIds(userId: string, volumeIds: string[]): Promise<Record<string, { isRead: boolean; progression: number | null }>> {
  if (!volumeIds.length) return {};

  const rows = await query<{ volume_id: string; is_read: boolean; progression: number | null }>(
    "SELECT volume_id, is_read, progression FROM user_to_books WHERE user_id = $1 AND volume_id = ANY($2::text[])",
    [userId, volumeIds],
  );

  return Object.fromEntries(rows.map((row) => [row.volume_id, {
    isRead: row.is_read,
    progression: row.progression,
  }]));
}

export async function getBookReaderStats(userId: string): Promise<{ totalVolumes: number; totalSeries: number; totalUnread: number }> {
  const [volumes, series, unread] = await Promise.all([
    queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM book_volumes"),
    queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM book_series WHERE is_oneshot = FALSE"),
    queryOne<{ count: string }>(`
      SELECT COUNT(*)::text AS count
      FROM book_volumes bv
      LEFT JOIN user_to_books ub ON ub.volume_id = bv.id AND ub.user_id = $1
      WHERE COALESCE(ub.is_read, FALSE) = FALSE`, [userId]),
  ]);

  return {
    totalVolumes: Number(volumes?.count ?? 0),
    totalSeries: Number(series?.count ?? 0),
    totalUnread: Number(unread?.count ?? 0),
  };
}

export async function listRecentlyReadBooks(userId: string, limit = 12): Promise<BookVolume[]> {
  const rows = await query<BookRow>(`${BOOK_SELECT}
    INNER JOIN user_to_books ub ON ub.volume_id = bv.id
    WHERE ub.user_id = $1 AND ub.is_read = TRUE AND ub.last_read_at IS NOT NULL
    ORDER BY ub.last_read_at DESC LIMIT $2`, [userId, limit]);
  return Promise.all(rows.map((row) => hydrateMetadata(mapBook(row))));
}

export async function listBookSeries(): Promise<Array<BookSeries & { volumeCount: number }>> {
  return query<BookSeries & { volumeCount: number }>(`
    SELECT bs.id, bs.slug, bs.title, bs.path, bs.is_oneshot AS "isOneshot", bs.status,
      bs.collection_type AS "collectionType",
      COUNT(bv.id)::int AS "volumeCount"
    FROM book_series bs LEFT JOIN book_volumes bv ON bv.series_id = bs.id
    GROUP BY bs.id ORDER BY bs.sort_title`);
}

export async function findBookSeriesBySlug(slug: string): Promise<BookSeries | null> {
  return queryOne<BookSeries>(`
    SELECT id, slug, title, path, is_oneshot AS "isOneshot", status,
      collection_type AS "collectionType"
    FROM book_series WHERE slug = $1 LIMIT 1`, [slug]);
}

export async function findBookSeriesById(id: string): Promise<BookSeries | null> {
  return queryOne<BookSeries>(`
    SELECT id, slug, title, path, is_oneshot AS "isOneshot", status,
      collection_type AS "collectionType"
    FROM book_series WHERE id = $1 LIMIT 1`, [id]);
}

export async function countBookVolumesBySeriesId(seriesId: string): Promise<number> {
  const result = await queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM book_volumes WHERE series_id = $1", [seriesId]);
  return Number(result?.count ?? 0);
}

export async function deleteBookVolumeRecord(volumeId: string): Promise<void> {
  await execute("DELETE FROM book_volumes WHERE id = $1", [volumeId]);
}

export async function deleteBookSeriesRecord(seriesId: string): Promise<void> {
  await execute("DELETE FROM book_series WHERE id = $1", [seriesId]);
}

export async function deleteBookChecksums(filePaths: string[]): Promise<void> {
  if (!filePaths.length) return;
  await execute("DELETE FROM book_file_checksums WHERE file_path = ANY($1::text[])", [filePaths]);
}

export async function countBooks(): Promise<number> {
  const result = await queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM book_volumes");
  return Number(result?.count ?? 0);
}

export async function getBookChecksums(): Promise<Map<string, string>> {
  const rows = await query<{ file_path: string; checksum: string }>("SELECT file_path, checksum FROM book_file_checksums");
  return new Map(rows.map((row) => [row.file_path, row.checksum]));
}

export async function saveBookChecksum(filePath: string, checksum: string): Promise<void> {
  await execute(`INSERT INTO book_file_checksums (id,file_path,checksum) VALUES ($1,$2,$3)
    ON CONFLICT (file_path) DO UPDATE SET checksum=EXCLUDED.checksum,updated_at=NOW()`, [createId(), filePath, checksum]);
}

export async function removeMissingBooks(existingPaths: Set<string>): Promise<void> {
  const paths = await query<{ full_path: string }>("SELECT full_path FROM book_volumes");
  for (const { full_path } of paths) {
    if (existingPaths.has(full_path)) continue;
    await execute("DELETE FROM book_volumes WHERE full_path=$1", [full_path]);
    await execute("DELETE FROM book_file_checksums WHERE file_path=$1", [full_path]);
  }
  await execute("DELETE FROM book_series WHERE NOT EXISTS (SELECT 1 FROM book_volumes WHERE book_volumes.series_id=book_series.id)");
}
