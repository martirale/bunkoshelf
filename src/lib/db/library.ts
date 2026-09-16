import { cacheLife, cacheTag } from "next/cache";
import {
  getLibrarySection,
  type LibraryScope,
  type LibrarySection,
} from "@/lib/librarySection";
import { MANGA_LIBRARY_TAG } from "@/lib/mangaLibraryCache";
import { query, queryOne } from "./query";
import { getCurrentContentVisibilityPolicy } from "@/lib/parentalControlServer";
import { canViewAgeRating, type ContentVisibilityPolicy } from "@/lib/parentalControl";

export interface GenreFilter {
  id: string;
  name: string;
}

export interface TagFilter {
  id: string;
  name: string;
}

export interface AuthorFilter {
  id: string;
  name: string;
}

export interface LibrarySeries {
  id: string;
  slug: string;
  title: string;
  path: string;
  isOneshot: boolean;
  mtime: Date;
  status: string;
  librarySection: "manga" | "comic" | "other";
  createdAt: Date;
  updatedAt: Date;
}

export interface LibraryVolumeMetadata {
  id: string;
  filePath: string;
  title: string | null;
  series: string | null;
  number: number | null;
  count: number | null;
  summary: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  writer: string | null;
  penciller: string | null;
  inker: string | null;
  colorist: string | null;
  letterer: string | null;
  coverArtist: string | null;
  editor: string | null;
  publisher: string | null;
  imprint: string | null;
  web: string | null;
  pageCount: number | null;
  languageISO: string | null;
  format: string | null;
  mangaStyle: string | null;
  ageRating: string | null;
  communityRating: number | null;
  gtin: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserVolumeProgress {
  id: string;
  userId: string;
  volumeId: string;
  isRead: boolean;
  isFavorite: boolean;
  personalRating: number | null;
  lastPage: number | null;
  totalPages: number | null;
  lastReadAt: Date | null;
  firstRead: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LibraryRelationTag {
  id: string;
  name: string;
}

export interface LibraryVolume {
  id: string;
  slug: string;
  title: string;
  filename: string;
  fullPath: string;
  size: number;
  mtime: Date;
  coverImage: string | null;
  seriesId: string;
  metadataId: string | null;
  createdAt: Date;
  updatedAt: Date;
  series: LibrarySeries;
  metadataObj: LibraryVolumeMetadata | null;
  usersProgress: UserVolumeProgress[];
  genres: LibraryRelationTag[];
  tags: LibraryRelationTag[];
}

export interface LibrarySeriesWithVolumes extends LibrarySeries {
  volumes: LibraryVolume[];
}

interface SharedVolumeQueryOptions {
  includeGenres?: boolean;
  includeTags?: boolean;
  authorNames?: string[];
  genreNames?: string[];
  tagNames?: string[];
  seriesIds?: string[];
  volumeIds?: string[];
  scope?: LibraryScope;
}

interface VolumeQueryOptions extends SharedVolumeQueryOptions {
  userId?: string | null;
  onlyUnreadForUser?: boolean;
}

interface SharedSeriesQueryOptions {
  userId?: string | null;
  authorNames?: string[];
  genreNames?: string[];
  tagNames?: string[];
  seriesIds?: string[];
  includeGenres?: boolean;
  includeTags?: boolean;
  scope?: LibraryScope;
}

interface FindSeriesOptions {
  slug: string;
  userId?: string | null;
  includeGenres?: boolean;
  includeTags?: boolean;
  scope?: LibraryScope;
}

export interface SeriesVolumeAggregate {
  ageRating: string | null;
  communityRating: number | null;
  format: string | null;
  id: string;
  writer: string | null;
  penciller: string | null;
  inker: string | null;
  colorist: string | null;
  letterer: string | null;
  coverArtist: string | null;
  editor: string | null;
  publisher: string | null;
  imprint: string | null;
}

interface FindVolumeOptions extends SharedVolumeQueryOptions {
  slug: string;
  userId?: string | null;
}

interface PagedQueryOptions {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CatalogLibraryVolume {
  id: string;
  slug: string;
  section: LibrarySection | "books";
  title: string | null;
  series: string | null;
  number: number | null;
  year: number | null;
  writer: string | null;
  publisher: string | null;
  languageISO: string | null;
  ageRating: string | null;
  gtin: string | null;
  isRead: boolean;
  isFavorite: boolean;
}

export interface CatalogAuthorStats {
  author: string | null;
  works: number;
  avgRating: number | null;
  readCount: number;
  hasManga: boolean;
  hasComic: boolean;
  hasOthers: boolean;
  hasBooks: boolean;
}

export interface CatalogRelationStats {
  name: string;
  hasManga: boolean;
  hasComic: boolean;
  hasOthers: boolean;
  hasBooks: boolean;
  total: number;
}

export interface LibrarySectionCounts {
  manga: number;
  comic: number;
  others: number;
  books: number;
}

export interface FavoriteSectionCounts {
  mangaSeries: number;
  mangaVolumes: number;
  comicSeries: number;
  comicVolumes: number;
  otherSeries: number;
  otherVolumes: number;
  bookSeries: number;
  bookVolumes: number;
}

export async function getFavoriteSectionCounts(userId: string): Promise<FavoriteSectionCounts> {
  const [rows, bookSeriesFavorites, bookVolumeFavorites] = await Promise.all([query<{
    library_section: "manga" | "comic" | "other";
    favorite_type: "series" | "volumes";
    total: string;
  }>(`
    SELECT ls.library_section, 'series' AS favorite_type, COUNT(*)::text AS total
    FROM user_to_series uts
    INNER JOIN library_series ls ON ls.id = uts.series_id
    WHERE uts.user_id = $1 AND uts.is_favorite = TRUE
    GROUP BY ls.library_section
    UNION ALL
    SELECT ls.library_section, 'volumes' AS favorite_type, COUNT(*)::text AS total
    FROM user_to_volumes utv
    INNER JOIN library_volumes lv ON lv.id = utv.volume_id
    INNER JOIN library_series ls ON ls.id = lv.series_id
    WHERE utv.user_id = $1 AND utv.is_favorite = TRUE
    GROUP BY ls.library_section
  `, [userId]), queryOne<{ total: string }>(
    "SELECT COUNT(*)::text AS total FROM user_to_book_series WHERE user_id = $1 AND is_favorite = TRUE", [userId]), queryOne<{ total: string }>(
    "SELECT COUNT(*)::text AS total FROM user_to_books WHERE user_id = $1 AND is_favorite = TRUE", [userId])]);
  const counts: FavoriteSectionCounts = { mangaSeries: 0, mangaVolumes: 0, comicSeries: 0, comicVolumes: 0, otherSeries: 0, otherVolumes: 0, bookSeries: 0, bookVolumes: 0 };
  for (const row of rows) {
    const key = `${row.library_section === "other" ? "other" : row.library_section}${row.favorite_type === "series" ? "Series" : "Volumes"}` as keyof FavoriteSectionCounts;
    counts[key] = Number(row.total);
  }
  counts.bookSeries = Number(bookSeriesFavorites?.total ?? "0");
  counts.bookVolumes = Number(bookVolumeFavorites?.total ?? "0");
  return counts;
}

export async function getLibrarySectionCounts(): Promise<LibrarySectionCounts> {
  const [rows, bookCount] = await Promise.all([query<{ library_section: "manga" | "comic" | "other"; total: string }>(`
    SELECT library_section, COUNT(*)::text AS total
    FROM library_series
    GROUP BY library_section
  `), queryOne<{ total: string }>("SELECT COUNT(*)::text AS total FROM book_volumes")]);
  const counts = { manga: 0, comic: 0, others: 0, books: 0 };
  for (const row of rows) {
    if (row.library_section === "manga") counts.manga += Number(row.total);
    else if (row.library_section === "comic") counts.comic += Number(row.total);
    else counts.others += Number(row.total);
  }
  counts.books = Number(bookCount?.total ?? "0");
  return counts;
}

interface VolumeRow {
  volume_id: string;
  volume_slug: string;
  volume_title: string;
  volume_filename: string;
  volume_full_path: string;
  volume_size: number;
  volume_mtime: Date;
  volume_cover_image: string | null;
  volume_series_id: string;
  volume_metadata_id: string | null;
  volume_created_at: Date;
  volume_updated_at: Date;
  series_id: string;
  series_slug: string;
  series_title: string;
  series_path: string;
  series_is_oneshot: boolean;
  series_mtime: Date;
  series_status: string;
  series_library_section: "manga" | "comic" | "other";
  series_created_at: Date;
  series_updated_at: Date;
  metadata_id: string | null;
  metadata_file_path: string | null;
  metadata_title: string | null;
  metadata_series: string | null;
  metadata_number: number | null;
  metadata_count: number | null;
  metadata_summary: string | null;
  metadata_year: number | null;
  metadata_month: number | null;
  metadata_day: number | null;
  metadata_writer: string | null;
  metadata_penciller: string | null;
  metadata_inker: string | null;
  metadata_colorist: string | null;
  metadata_letterer: string | null;
  metadata_cover_artist: string | null;
  metadata_editor: string | null;
  metadata_publisher: string | null;
  metadata_imprint: string | null;
  metadata_web: string | null;
  metadata_page_count: number | null;
  metadata_language_iso: string | null;
  metadata_format: string | null;
  metadata_manga_style: string | null;
  metadata_age_rating: string | null;
  metadata_community_rating: number | null;
  metadata_gtin: string | null;
  metadata_created_at: Date | null;
  metadata_updated_at: Date | null;
  progress_id: string | null;
  progress_user_id: string | null;
  progress_volume_id: string | null;
  progress_is_read: boolean | null;
  progress_is_favorite: boolean | null;
  progress_personal_rating: number | null;
  progress_last_page: number | null;
  progress_total_pages: number | null;
  progress_last_read_at: Date | null;
  progress_first_read: string | null;
  progress_created_at: Date | null;
  progress_updated_at: Date | null;
}

function mapSeries(row: VolumeRow): LibrarySeries {
  return {
    id: row.series_id,
    slug: row.series_slug,
    title: row.series_title,
    path: row.series_path,
    isOneshot: row.series_is_oneshot,
    mtime: row.series_mtime,
    status: row.series_status,
    librarySection: row.series_library_section,
    createdAt: row.series_created_at,
    updatedAt: row.series_updated_at,
  };
}

function mapMetadata(row: VolumeRow): LibraryVolumeMetadata | null {
  if (!row.metadata_id || !row.metadata_file_path) {
    return null;
  }

  return {
    id: row.metadata_id,
    filePath: row.metadata_file_path,
    title: row.metadata_title,
    series: row.metadata_series,
    number: row.metadata_number,
    count: row.metadata_count,
    summary: row.metadata_summary,
    year: row.metadata_year,
    month: row.metadata_month,
    day: row.metadata_day,
    writer: row.metadata_writer,
    penciller: row.metadata_penciller,
    inker: row.metadata_inker,
    colorist: row.metadata_colorist,
    letterer: row.metadata_letterer,
    coverArtist: row.metadata_cover_artist,
    editor: row.metadata_editor,
    publisher: row.metadata_publisher,
    imprint: row.metadata_imprint,
    web: row.metadata_web,
    pageCount: row.metadata_page_count,
    languageISO: row.metadata_language_iso,
    format: row.metadata_format,
    mangaStyle: row.metadata_manga_style,
    ageRating: row.metadata_age_rating,
    communityRating: row.metadata_community_rating,
    gtin: row.metadata_gtin,
    createdAt: row.metadata_created_at ?? row.volume_created_at,
    updatedAt: row.metadata_updated_at ?? row.volume_updated_at,
  };
}

function mapProgress(row: VolumeRow): UserVolumeProgress[] {
  if (
    !row.progress_id ||
    !row.progress_user_id ||
    !row.progress_volume_id ||
    !row.progress_created_at ||
    !row.progress_updated_at
  ) {
    return [];
  }

  return [
    {
      id: row.progress_id,
      userId: row.progress_user_id,
      volumeId: row.progress_volume_id,
      isRead: row.progress_is_read ?? false,
      isFavorite: row.progress_is_favorite ?? false,
      personalRating: row.progress_personal_rating,
      lastPage: row.progress_last_page,
      totalPages: row.progress_total_pages,
      lastReadAt: row.progress_last_read_at,
      firstRead: row.progress_first_read,
      createdAt: row.progress_created_at,
      updatedAt: row.progress_updated_at,
    },
  ];
}

function mapVolume(row: VolumeRow): LibraryVolume {
  return {
    id: row.volume_id,
    slug: row.volume_slug,
    title: row.volume_title,
    filename: row.volume_filename,
    fullPath: row.volume_full_path,
    size: row.volume_size,
    mtime: row.volume_mtime,
    coverImage: row.volume_cover_image,
    seriesId: row.volume_series_id,
    metadataId: row.volume_metadata_id,
    createdAt: row.volume_created_at,
    updatedAt: row.volume_updated_at,
    series: mapSeries(row),
    metadataObj: mapMetadata(row),
    usersProgress: mapProgress(row),
    genres: [],
    tags: [],
  };
}

async function attachVolumeRelations(
  volumes: LibraryVolume[],
  options: { includeGenres?: boolean; includeTags?: boolean }
): Promise<LibraryVolume[]> {
  if (volumes.length === 0) {
    return volumes;
  }

  const ids = volumes.map((volume) => volume.id);
  const byId = new Map(volumes.map((volume) => [volume.id, volume]));

  if (options.includeGenres) {
    const rows = await query<{
      volume_id: string;
      genre_id: string;
      genre_name: string;
    }>(
      `
        SELECT vtg.volume_id, g.id AS genre_id, g.name AS genre_name
        FROM volume_to_genres vtg
        INNER JOIN genres g ON g.id = vtg.genre_id
        WHERE vtg.volume_id = ANY($1::text[])
        ORDER BY g.name ASC
      `,
      [ids]
    );

    for (const row of rows) {
      byId.get(row.volume_id)?.genres.push({
        id: row.genre_id,
        name: row.genre_name,
      });
    }
  }

  if (options.includeTags) {
    const rows = await query<{
      volume_id: string;
      tag_id: string;
      tag_name: string;
    }>(
      `
        SELECT vtt.volume_id, t.id AS tag_id, t.name AS tag_name
        FROM volume_to_tags vtt
        INNER JOIN tags t ON t.id = vtt.tag_id
        WHERE vtt.volume_id = ANY($1::text[])
        ORDER BY t.name ASC
      `,
      [ids]
    );

    for (const row of rows) {
      byId.get(row.volume_id)?.tags.push({
        id: row.tag_id,
        name: row.tag_name,
      });
    }
  }

  return volumes;
}

function buildVolumeFilterSql(
  options: {
    authorNames?: string[];
    genreNames?: string[];
    tagNames?: string[];
    seriesIds?: string[];
    volumeIds?: string[];
    userId?: string | null;
    onlyUnreadForUser?: boolean;
    scope?: LibraryScope;
  },
  params: unknown[]
): string[] {
  const conditions: string[] = [];

  if (options.scope === "others") {
    conditions.push(`ms.library_section = 'other'`);
  }

  if (options.scope === "comic") {
    conditions.push(`ms.library_section = 'comic'`);
  }

  if (options.scope === "manga") {
    conditions.push(`ms.library_section = 'manga'`);
  }

  if (options.seriesIds && options.seriesIds.length > 0) {
    params.push(options.seriesIds);
    conditions.push(`mv.series_id = ANY($${params.length}::text[])`);
  }

  if (options.volumeIds && options.volumeIds.length > 0) {
    params.push(options.volumeIds);
    conditions.push(`mv.id = ANY($${params.length}::text[])`);
  }

  if (options.authorNames && options.authorNames.length > 0) {
    params.push(options.authorNames);
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM regexp_split_to_table(
          COALESCE(NULLIF(BTRIM(vm.writer), ''), '__unknown__'),
          ','
        ) AS split_author(value)
        WHERE BTRIM(split_author.value) = ANY($${params.length}::text[])
      )
    `);
  }

  if (options.genreNames && options.genreNames.length > 0) {
    for (const genreName of options.genreNames) {
      params.push(genreName);
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM volume_to_genres vtg
          INNER JOIN genres g ON g.id = vtg.genre_id
          WHERE vtg.volume_id = mv.id
            AND g.name = $${params.length}
        )
      `);
    }
  }

  if (options.tagNames && options.tagNames.length > 0) {
    for (const tagName of options.tagNames) {
      params.push(tagName);
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM volume_to_tags vtt
          INNER JOIN tags t ON t.id = vtt.tag_id
          WHERE vtt.volume_id = mv.id
            AND t.name = $${params.length}
        )
      `);
    }
  }

  if (options.onlyUnreadForUser && options.userId) {
    params.push(options.userId);
    const userParam = params.length;
    conditions.push(`
      (
        NOT EXISTS (
          SELECT 1
          FROM user_to_volumes utv
          WHERE utv.volume_id = mv.id
            AND utv.user_id = $${userParam}
        )
        OR EXISTS (
          SELECT 1
          FROM user_to_volumes utv
          WHERE utv.volume_id = mv.id
            AND utv.user_id = $${userParam}
            AND utv.is_read = FALSE
        )
      )
    `);
  }

  return conditions;
}

function buildLibraryFilterScopeConditions(
  params: unknown[],
  scope?: LibraryScope
): string {
  if (scope === "others") {
    return `
      WHERE ms.library_section = 'other'
    `;
  }

  if (scope === "comic") {
    return `
      WHERE ms.library_section = 'comic'
    `;
  }

  if (scope === "manga") {
    return `
      WHERE ms.library_section = 'manga'
    `;
  }

  return "";
}

function buildPagination(options?: PagedQueryOptions) {
  const pageSize = Math.max(1, options?.pageSize ?? 1);
  const page = Math.max(1, options?.page ?? 1);

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

function mapPaginatedResult<T>(
  items: T[],
  total: number,
  pagination: ReturnType<typeof buildPagination>
): PaginatedResult<T> {
  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
}

function parseCount(value: string | number): number {
  return typeof value === "number" ? value : Number(value);
}

export async function listPagedCatalogLibraryVolumes(
  options?: PagedQueryOptions & { userId?: string | null }
): Promise<PaginatedResult<CatalogLibraryVolume>> {
  const pagination = buildPagination(options);
  const policy = await getCurrentContentVisibilityPolicy();
  const catalogLimit = policy.enabled ? 50_000 : pagination.pageSize;
  const catalogOffset = policy.enabled ? 0 : pagination.offset;

  const [countRow, rows] = await Promise.all([
    queryOne<{ total: string | number }>(
      `
        SELECT
          (
            (SELECT COUNT(*) FROM manga_volumes)
            +
            (SELECT COUNT(*) FROM book_volumes)
          ) AS total
      `
    ),
    query<{
      id: string;
      slug: string;
      title: string | null;
      series: string | null;
      number: number | null;
      year: number | null;
      writer: string | null;
      publisher: string | null;
      language_iso: string | null;
      age_rating: string | null;
      gtin: string | null;
      library_section: "manga" | "comic" | "other" | "books";
      is_read: boolean | null;
      is_favorite: boolean | null;
    }>(
      `
        WITH catalog_volumes AS (
          SELECT
            mv.id,
            mv.slug,
            vm.title,
            ms.title AS series,
            vm.number,
            vm.year,
            vm.writer,
            vm.publisher,
            vm.language_iso,
            vm.age_rating,
            vm.gtin,
            ms.library_section,
            utv.is_read,
            utv.is_favorite,
            ms.sort_title AS series_sort_title,
            mv.sort_title AS volume_sort_title
          FROM manga_volumes mv
          INNER JOIN manga_series ms ON ms.id = mv.series_id
          LEFT JOIN volume_metadata vm ON vm.id = mv.metadata_id
          LEFT JOIN user_to_volumes utv
            ON utv.volume_id = mv.id
           AND utv.user_id = $1

          UNION ALL

          SELECT
            bv.id,
            bv.slug,
            bm.title,
            bs.title AS series,
            bv.number,
            SUBSTRING(bm.published_at FROM '([0-9]{4})')::integer AS year,
            (
              SELECT STRING_AGG(bp.name, ', ' ORDER BY bp.position, bp.id)
              FROM book_people bp
              WHERE bp.metadata_id = bm.id
                AND bp.kind = 'creator'
                AND (bp.role IS NULL OR LOWER(bp.role) = 'aut')
            ) AS writer,
            bm.publisher,
            bm.language AS language_iso,
            bm.age_rating,
            (
              SELECT REGEXP_REPLACE(bi.value, '^(?:urn:)?isbn:', '', 'i')
              FROM book_identifiers bi
              WHERE bi.metadata_id = bm.id
                AND LOWER(bi.scheme) = 'isbn'
              ORDER BY bi.is_primary DESC, bi.id
              LIMIT 1
            ) AS gtin,
            'books' AS library_section,
            utb.is_read,
            utb.is_favorite,
            bs.sort_title AS series_sort_title,
            bv.sort_title AS volume_sort_title
          FROM book_volumes bv
          INNER JOIN book_series bs ON bs.id = bv.series_id
          INNER JOIN book_metadata bm ON bm.volume_id = bv.id
          LEFT JOIN user_to_books utb
            ON utb.volume_id = bv.id
           AND utb.user_id = $1
        )
        SELECT
          id,
          slug,
          title,
          series,
          number,
          year,
          writer,
          publisher,
          language_iso,
          age_rating,
          gtin,
          library_section,
          is_read,
          is_favorite
        FROM catalog_volumes
        ORDER BY series_sort_title ASC, volume_sort_title ASC, id ASC
        LIMIT $2
        OFFSET $3
      `,
      [options?.userId ?? null, catalogLimit, catalogOffset]
    ),
  ]);

  const total = parseCount(countRow?.total ?? 0);

  const items: CatalogLibraryVolume[] = rows.filter((row) => canViewAgeRating(
    row.age_rating,
    row.library_section === "books" ? "book" : "manga",
    policy
  )).map((row) => ({
      id: row.id,
      slug: row.slug,
      section: (row.library_section === "books"
        ? "books"
        : getLibrarySection(row.library_section)) as CatalogLibraryVolume["section"],
      title: row.title,
      series: row.series,
      number: row.number,
      year: row.year,
      writer: row.writer,
      publisher: row.publisher,
      languageISO: row.language_iso,
      ageRating: row.age_rating,
      gtin: row.gtin,
      isRead: row.is_read === true,
      isFavorite: row.is_favorite === true,
    }));

  return mapPaginatedResult(
    policy.enabled
      ? items.slice(pagination.offset, pagination.offset + pagination.pageSize)
      : items,
    policy.enabled ? items.length : total,
    pagination
  );
}

export async function listPagedCatalogAuthors(
  options?: PagedQueryOptions & { userId?: string | null }
): Promise<PaginatedResult<CatalogAuthorStats>> {
  const pagination = buildPagination(options);

  const [countRow, rows] = await Promise.all([
    queryOne<{ total: string | number }>(
      `
        SELECT COUNT(*) AS total
        FROM (
          SELECT author.name
          FROM manga_volumes mv
          LEFT JOIN volume_metadata vm ON vm.id = mv.metadata_id
          CROSS JOIN LATERAL (
            SELECT DISTINCT BTRIM(split_author.value) AS name
            FROM regexp_split_to_table(
              COALESCE(NULLIF(BTRIM(vm.writer), ''), '__unknown__'),
              ','
            ) AS split_author(value)
            WHERE BTRIM(split_author.value) <> ''
          ) AS author
          GROUP BY author.name

          UNION

          SELECT COALESCE(author.name, '__unknown__') AS name
          FROM book_volumes bv
          INNER JOIN book_metadata bm ON bm.volume_id = bv.id
          LEFT JOIN LATERAL (
            SELECT DISTINCT BTRIM(bp.name) AS name
            FROM book_people bp
            WHERE bp.metadata_id = bm.id
              AND bp.kind = 'creator'
              AND (bp.role IS NULL OR LOWER(bp.role) = 'aut')
              AND BTRIM(bp.name) <> ''
          ) AS author ON TRUE
        ) AS authors
      `
    ),
    query<{
      author: string;
      works: string | number;
      avg_rating: number | null;
      read_count: string | number;
      has_manga: boolean | null;
      has_comic: boolean | null;
      has_others: boolean | null;
      has_books: boolean | null;
    }>(
      `
        WITH author_works AS (
          SELECT
            author.name AS author,
            mv.id AS volume_id,
            utv.personal_rating,
            utv.is_read,
            ms.library_section
          FROM manga_volumes mv
          INNER JOIN manga_series ms ON ms.id = mv.series_id
          LEFT JOIN volume_metadata vm ON vm.id = mv.metadata_id
          CROSS JOIN LATERAL (
            SELECT DISTINCT BTRIM(split_author.value) AS name
            FROM regexp_split_to_table(
              COALESCE(NULLIF(BTRIM(vm.writer), ''), '__unknown__'),
              ','
            ) AS split_author(value)
            WHERE BTRIM(split_author.value) <> ''
          ) AS author
          LEFT JOIN user_to_volumes utv
            ON utv.volume_id = mv.id
           AND utv.user_id = $1

          UNION ALL

          SELECT
            COALESCE(author.name, '__unknown__') AS author,
            bv.id AS volume_id,
            utb.personal_rating,
            utb.is_read,
            'books' AS library_section
          FROM book_volumes bv
          INNER JOIN book_metadata bm ON bm.volume_id = bv.id
          LEFT JOIN LATERAL (
            SELECT DISTINCT BTRIM(bp.name) AS name
            FROM book_people bp
            WHERE bp.metadata_id = bm.id
              AND bp.kind = 'creator'
              AND (bp.role IS NULL OR LOWER(bp.role) = 'aut')
              AND BTRIM(bp.name) <> ''
          ) AS author ON TRUE
          LEFT JOIN user_to_books utb
            ON utb.volume_id = bv.id
           AND utb.user_id = $1
        )
        SELECT
          author,
          COUNT(volume_id) AS works,
          ROUND(AVG(personal_rating)::numeric, 1)::float8 AS avg_rating,
          COUNT(*) FILTER (WHERE is_read = TRUE) AS read_count,
          BOOL_OR(library_section = 'manga') AS has_manga,
          BOOL_OR(library_section = 'comic') AS has_comic,
          BOOL_OR(library_section = 'other') AS has_others,
          BOOL_OR(library_section = 'books') AS has_books
        FROM author_works
        GROUP BY author
        ORDER BY author ASC
        LIMIT $2
        OFFSET $3
      `,
      [options?.userId ?? null, pagination.pageSize, pagination.offset]
    ),
  ]);

  const total = parseCount(countRow?.total ?? 0);

  return mapPaginatedResult(
    rows.map((row) => ({
      author: row.author === "__unknown__" ? null : row.author,
      works: parseCount(row.works),
      avgRating: row.avg_rating,
      readCount: parseCount(row.read_count),
      hasManga: row.has_manga === true,
      hasComic: row.has_comic === true,
      hasOthers: row.has_others === true,
      hasBooks: row.has_books === true,
    })),
    total,
    pagination
  );
}

const CATALOG_GENRE_STATS_SQL = `
  WITH manga_genres AS (
    SELECT
      g.id,
      g.name,
      BOOL_OR(ms.library_section = 'manga') AS has_manga,
      BOOL_OR(ms.library_section = 'comic') AS has_comic,
      BOOL_OR(ms.library_section = 'other') AS has_others,
      COUNT(DISTINCT mv.id) AS manga_total
    FROM genres g
    INNER JOIN volume_to_genres vtg ON vtg.genre_id = g.id
    INNER JOIN manga_volumes mv ON mv.id = vtg.volume_id
    INNER JOIN manga_series ms ON ms.id = mv.series_id
    GROUP BY g.id, g.name
  ),
  book_genres AS (
    SELECT
      mg.id AS genre_id,
      COUNT(DISTINCT bv.id) AS books_total
    FROM manga_genres mg
    INNER JOIN book_subjects bsub
      ON LOWER(BTRIM(bsub.name)) = LOWER(BTRIM(mg.name))
    INNER JOIN book_metadata bm ON bm.id = bsub.metadata_id
    INNER JOIN book_volumes bv ON bv.id = bm.volume_id
    GROUP BY mg.id
  )
  SELECT
    mg.name,
    mg.has_manga,
    mg.has_comic,
    mg.has_others,
    COALESCE(bg.books_total, 0) > 0 AS has_books,
    mg.manga_total + COALESCE(bg.books_total, 0) AS total
  FROM manga_genres mg
  LEFT JOIN book_genres bg ON bg.genre_id = mg.id
`;

const CATALOG_TAG_STATS_SQL = `
  WITH manga_tags AS (
    SELECT
      t.id,
      t.name,
      BOOL_OR(ms.library_section = 'manga') AS has_manga,
      BOOL_OR(ms.library_section = 'comic') AS has_comic,
      BOOL_OR(ms.library_section = 'other') AS has_others,
      COUNT(DISTINCT mv.id) AS manga_total
    FROM tags t
    INNER JOIN volume_to_tags vtt ON vtt.tag_id = t.id
    INNER JOIN manga_volumes mv ON mv.id = vtt.volume_id
    INNER JOIN manga_series ms ON ms.id = mv.series_id
    GROUP BY t.id, t.name
  ),
  active_genres AS (
    SELECT DISTINCT LOWER(BTRIM(g.name)) AS normalized_name
    FROM genres g
    INNER JOIN volume_to_genres vtg ON vtg.genre_id = g.id
    INNER JOIN manga_volumes mv ON mv.id = vtg.volume_id
  ),
  book_tag_matches AS (
    SELECT
      mt.id AS tag_id,
      COUNT(DISTINCT bv.id) AS books_total
    FROM manga_tags mt
    INNER JOIN book_subjects bsub
      ON LOWER(BTRIM(bsub.name)) = LOWER(BTRIM(mt.name))
    INNER JOIN book_metadata bm ON bm.id = bsub.metadata_id
    INNER JOIN book_volumes bv ON bv.id = bm.volume_id
    GROUP BY mt.id
  ),
  unmatched_book_tags AS (
    SELECT
      MIN(BTRIM(bsub.name)) AS name,
      COUNT(DISTINCT bv.id) AS total
    FROM book_subjects bsub
    INNER JOIN book_metadata bm ON bm.id = bsub.metadata_id
    INNER JOIN book_volumes bv ON bv.id = bm.volume_id
    WHERE BTRIM(bsub.name) <> ''
      AND NOT EXISTS (
        SELECT 1
        FROM active_genres ag
        WHERE ag.normalized_name = LOWER(BTRIM(bsub.name))
      )
      AND NOT EXISTS (
        SELECT 1
        FROM manga_tags mt
        WHERE LOWER(BTRIM(mt.name)) = LOWER(BTRIM(bsub.name))
      )
    GROUP BY LOWER(BTRIM(bsub.name))
  )
  SELECT
    mt.name,
    mt.has_manga,
    mt.has_comic,
    mt.has_others,
    COALESCE(btm.books_total, 0) > 0 AS has_books,
    mt.manga_total + COALESCE(btm.books_total, 0) AS total
  FROM manga_tags mt
  LEFT JOIN book_tag_matches btm ON btm.tag_id = mt.id

  UNION ALL

  SELECT
    ubt.name,
    FALSE AS has_manga,
    FALSE AS has_comic,
    FALSE AS has_others,
    TRUE AS has_books,
    ubt.total
  FROM unmatched_book_tags ubt
`;

export async function listPagedCatalogGenres(
  options?: PagedQueryOptions
): Promise<PaginatedResult<CatalogRelationStats>> {
  const pagination = buildPagination(options);

  const [countRow, rows] = await Promise.all([
    queryOne<{ total: string | number }>(
      `
        SELECT COUNT(*) AS total
        FROM (${CATALOG_GENRE_STATS_SQL}) AS catalog_genres
      `
    ),
    query<{
      name: string;
      has_manga: boolean | null;
      has_comic: boolean | null;
      has_others: boolean | null;
      has_books: boolean | null;
      total: string | number;
    }>(
      `
        ${CATALOG_GENRE_STATS_SQL}
        ORDER BY name ASC
        LIMIT $1
        OFFSET $2
      `,
      [pagination.pageSize, pagination.offset]
    ),
  ]);

  const total = parseCount(countRow?.total ?? 0);

  return mapPaginatedResult(
    rows.map((row) => ({
      name: row.name,
      hasManga: row.has_manga === true,
      hasComic: row.has_comic === true,
      hasOthers: row.has_others === true,
      hasBooks: row.has_books === true,
      total: parseCount(row.total),
    })),
    total,
    pagination
  );
}

export async function listPagedCatalogTags(
  options?: PagedQueryOptions
): Promise<PaginatedResult<CatalogRelationStats>> {
  const pagination = buildPagination(options);

  const [countRow, rows] = await Promise.all([
    queryOne<{ total: string | number }>(
      `
        SELECT COUNT(*) AS total
        FROM (${CATALOG_TAG_STATS_SQL}) AS catalog_tags
      `
    ),
    query<{
      name: string;
      has_manga: boolean | null;
      has_comic: boolean | null;
      has_others: boolean | null;
      has_books: boolean | null;
      total: string | number;
    }>(
      `
        ${CATALOG_TAG_STATS_SQL}
        ORDER BY name ASC
        LIMIT $1
        OFFSET $2
      `,
      [pagination.pageSize, pagination.offset]
    ),
  ]);

  const total = parseCount(countRow?.total ?? 0);

  return mapPaginatedResult(
    rows.map((row) => ({
      name: row.name,
      hasManga: row.has_manga === true,
      hasComic: row.has_comic === true,
      hasOthers: row.has_others === true,
      hasBooks: row.has_books === true,
      total: parseCount(row.total),
    })),
    total,
    pagination
  );
}

async function listLibraryFiltersRaw(scope?: LibraryScope): Promise<{
  authors: AuthorFilter[];
  genres: GenreFilter[];
  tags: TagFilter[];
}> {
  const authorParams: unknown[] = [];
  const genreParams: unknown[] = [];
  const tagParams: unknown[] = [];
  const authorScopeWhere = buildLibraryFilterScopeConditions(authorParams, scope);
  const genreScopeWhere = buildLibraryFilterScopeConditions(genreParams, scope);
  const tagScopeWhere = buildLibraryFilterScopeConditions(tagParams, scope);

  const [authors, genres, tags] = await Promise.all([
    query<AuthorFilter>(
      `
        SELECT DISTINCT
          author.name AS id,
          author.name
        FROM manga_volumes mv
        INNER JOIN manga_series ms ON ms.id = mv.series_id
        LEFT JOIN volume_metadata vm ON vm.id = mv.metadata_id
        CROSS JOIN LATERAL (
          SELECT DISTINCT BTRIM(split_author.value) AS name
          FROM regexp_split_to_table(
            COALESCE(NULLIF(BTRIM(vm.writer), ''), '__unknown__'),
            ','
          ) AS split_author(value)
          WHERE BTRIM(split_author.value) <> ''
        ) AS author
        ${authorScopeWhere}
        ORDER BY name ASC
      `,
      authorParams
    ),
    query<GenreFilter>(
      `
        SELECT DISTINCT g.id, g.name
        FROM genres g
        INNER JOIN volume_to_genres vtg ON vtg.genre_id = g.id
        INNER JOIN manga_volumes mv ON mv.id = vtg.volume_id
        INNER JOIN manga_series ms ON ms.id = mv.series_id
        LEFT JOIN volume_metadata vm ON vm.id = mv.metadata_id
        ${genreScopeWhere}
        ORDER BY g.name ASC
      `,
      genreParams
    ),
    query<TagFilter>(
      `
        SELECT DISTINCT t.id, t.name
        FROM tags t
        INNER JOIN volume_to_tags vtt ON vtt.tag_id = t.id
        INNER JOIN manga_volumes mv ON mv.id = vtt.volume_id
        INNER JOIN manga_series ms ON ms.id = mv.series_id
        LEFT JOIN volume_metadata vm ON vm.id = mv.metadata_id
        ${tagScopeWhere}
        ORDER BY t.name ASC
      `,
      tagParams
    ),
  ]);

  return { authors, genres, tags };
}

async function listLibraryFiltersCached(scope?: LibraryScope) {
  "use cache";

  cacheLife("max");
  cacheTag(MANGA_LIBRARY_TAG);

  return listLibraryFiltersRaw(scope);
}

export async function listLibraryFilters(scope?: LibraryScope): Promise<{
  authors: AuthorFilter[];
  genres: GenreFilter[];
  tags: TagFilter[];
}> {
  return listLibraryFiltersCached(scope);
}

async function listVolumesRaw(
  options?: VolumeQueryOptions
): Promise<LibraryVolume[]> {
  const params: unknown[] = [];
  const progressJoin =
    options?.userId
      ? (() => {
          params.push(options.userId);
          return `
            LEFT JOIN user_to_volumes utv
              ON utv.volume_id = mv.id
             AND utv.user_id = $${params.length}
          `;
        })()
      : `
          LEFT JOIN user_to_volumes utv
            ON FALSE
        `;

  const conditions = buildVolumeFilterSql(
    {
      authorNames: options?.authorNames,
      genreNames: options?.genreNames,
      tagNames: options?.tagNames,
      seriesIds: options?.seriesIds,
      volumeIds: options?.volumeIds,
      userId: options?.userId,
      onlyUnreadForUser: options?.onlyUnreadForUser,
      scope: options?.scope,
    },
    params
  );

  const rows = await query<VolumeRow>(
    `
      SELECT
        mv.id AS volume_id,
        mv.slug AS volume_slug,
        mv.title AS volume_title,
        mv.filename AS volume_filename,
        mv.full_path AS volume_full_path,
        mv.size AS volume_size,
        mv.mtime AS volume_mtime,
        mv.cover_image AS volume_cover_image,
        mv.series_id AS volume_series_id,
        mv.metadata_id AS volume_metadata_id,
        mv.created_at AS volume_created_at,
        mv.updated_at AS volume_updated_at,
        ms.id AS series_id,
        ms.slug AS series_slug,
        ms.title AS series_title,
        ms.path AS series_path,
        ms.is_oneshot AS series_is_oneshot,
        ms.mtime AS series_mtime,
        ms.status AS series_status,
        ms.library_section AS series_library_section,
        ms.created_at AS series_created_at,
        ms.updated_at AS series_updated_at,
        vm.id AS metadata_id,
        vm.file_path AS metadata_file_path,
        vm.title AS metadata_title,
        vm.series AS metadata_series,
        vm.number AS metadata_number,
        vm.count AS metadata_count,
        vm.summary AS metadata_summary,
        vm.year AS metadata_year,
        vm.month AS metadata_month,
        vm.day AS metadata_day,
        vm.writer AS metadata_writer,
        vm.penciller AS metadata_penciller,
        vm.inker AS metadata_inker,
        vm.colorist AS metadata_colorist,
        vm.letterer AS metadata_letterer,
        vm.cover_artist AS metadata_cover_artist,
        vm.editor AS metadata_editor,
        vm.publisher AS metadata_publisher,
        vm.imprint AS metadata_imprint,
        vm.web AS metadata_web,
        vm.page_count AS metadata_page_count,
        vm.language_iso AS metadata_language_iso,
        vm.format AS metadata_format,
        vm.manga_style AS metadata_manga_style,
        vm.age_rating AS metadata_age_rating,
        vm.community_rating AS metadata_community_rating,
        vm.gtin AS metadata_gtin,
        vm.created_at AS metadata_created_at,
        vm.updated_at AS metadata_updated_at,
        utv.id AS progress_id,
        utv.user_id AS progress_user_id,
        utv.volume_id AS progress_volume_id,
        utv.is_read AS progress_is_read,
        utv.is_favorite AS progress_is_favorite,
        utv.personal_rating AS progress_personal_rating,
        utv.last_page AS progress_last_page,
        utv.total_pages AS progress_total_pages,
        utv.last_read_at AS progress_last_read_at,
        utv.first_read AS progress_first_read,
        utv.created_at AS progress_created_at,
        utv.updated_at AS progress_updated_at
      FROM manga_volumes mv
      INNER JOIN manga_series ms ON ms.id = mv.series_id
      LEFT JOIN volume_metadata vm ON vm.id = mv.metadata_id
      ${progressJoin}
      ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
      ORDER BY ms.sort_title ASC, mv.sort_title ASC, mv.id ASC
    `,
    params
  );

  const volumes = rows.map(mapVolume);
  return attachVolumeRelations(volumes, {
    includeGenres: options?.includeGenres,
    includeTags: options?.includeTags,
  });
}

async function listVolumesCached(options: SharedVolumeQueryOptions = {}) {
  "use cache";

  cacheLife("max");
  cacheTag(MANGA_LIBRARY_TAG);

  return listVolumesRaw(options);
}

export async function listVolumes(
  options?: VolumeQueryOptions
): Promise<LibraryVolume[]> {
  const policy = await getCurrentContentVisibilityPolicy();
  const result = options?.userId || options?.onlyUnreadForUser
    ? await listVolumesRaw(options)
    : await listVolumesCached({
    includeGenres: options?.includeGenres,
    includeTags: options?.includeTags,
    authorNames: options?.authorNames,
    genreNames: options?.genreNames,
    tagNames: options?.tagNames,
    seriesIds: options?.seriesIds,
    volumeIds: options?.volumeIds,
    scope: options?.scope,
    });
  return filterVisibleVolumes(result, policy);
}

function filterVisibleVolumes(volumes: LibraryVolume[], policy: ContentVisibilityPolicy): LibraryVolume[] {
  return volumes.filter((volume) => canViewAgeRating(volume.metadataObj?.ageRating, "manga", policy));
}

async function listPagedVolumeIdsRaw(
  options?: VolumeQueryOptions & PagedQueryOptions
): Promise<PaginatedResult<string>> {
  const pagination = buildPagination(options);
  const countParams: unknown[] = [];
  const countConditions = buildVolumeFilterSql(
    {
      authorNames: options?.authorNames,
      genreNames: options?.genreNames,
      tagNames: options?.tagNames,
      seriesIds: options?.seriesIds,
      volumeIds: options?.volumeIds,
      userId: options?.userId,
      onlyUnreadForUser: options?.onlyUnreadForUser,
      scope: options?.scope,
    },
    countParams
  );
  const rowsParams = [...countParams];

  const [countRow, rows] = await Promise.all([
    queryOne<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM manga_volumes mv
        INNER JOIN manga_series ms ON ms.id = mv.series_id
        LEFT JOIN volume_metadata vm ON vm.id = mv.metadata_id
        ${countConditions.length > 0 ? `WHERE ${countConditions.join(" AND ")}` : ""}
      `,
      countParams
    ),
    query<{ id: string }>(
      `
        SELECT mv.id
        FROM manga_volumes mv
        INNER JOIN manga_series ms ON ms.id = mv.series_id
        LEFT JOIN volume_metadata vm ON vm.id = mv.metadata_id
        ${countConditions.length > 0 ? `WHERE ${countConditions.join(" AND ")}` : ""}
        ORDER BY mv.sort_title ASC, mv.id ASC
        LIMIT $${rowsParams.push(pagination.pageSize)}
        OFFSET $${rowsParams.push(pagination.offset)}
      `,
      rowsParams
    ),
  ]);

  return mapPaginatedResult(
    rows.map((row) => row.id),
    parseCount(countRow?.total ?? 0),
    pagination
  );
}

async function listPagedVolumeIdsCached(
  options: SharedVolumeQueryOptions & PagedQueryOptions = {}
) {
  "use cache";

  cacheLife("max");
  cacheTag(MANGA_LIBRARY_TAG);

  return listPagedVolumeIdsRaw(options);
}

export async function listPagedVolumes(
  options?: VolumeQueryOptions &
    PagedQueryOptions & {
      includeGenres?: boolean;
      includeTags?: boolean;
    }
): Promise<PaginatedResult<LibraryVolume>> {
  const policy = await getCurrentContentVisibilityPolicy();
  if (policy.enabled) {
    const all = await listVolumes({
      includeGenres: options?.includeGenres,
      includeTags: options?.includeTags,
      authorNames: options?.authorNames,
      genreNames: options?.genreNames,
      tagNames: options?.tagNames,
      seriesIds: options?.seriesIds,
      volumeIds: options?.volumeIds,
      userId: options?.userId,
      onlyUnreadForUser: options?.onlyUnreadForUser,
      scope: options?.scope,
    });
    const pagination = buildPagination(options);
    return mapPaginatedResult(all.slice(pagination.offset, pagination.offset + pagination.pageSize), all.length, pagination);
  }
  const pagedIds = options?.userId || options?.onlyUnreadForUser
    ? await listPagedVolumeIdsRaw(options)
    : await listPagedVolumeIdsCached({
        includeGenres: options?.includeGenres,
        includeTags: options?.includeTags,
        authorNames: options?.authorNames,
        genreNames: options?.genreNames,
        tagNames: options?.tagNames,
        seriesIds: options?.seriesIds,
        volumeIds: options?.volumeIds,
        scope: options?.scope,
        page: options?.page,
        pageSize: options?.pageSize,
      });

  if (pagedIds.items.length === 0) {
    return {
      ...pagedIds,
      items: [],
    };
  }

  const volumes = await listVolumes({
    volumeIds: pagedIds.items,
    includeGenres: options?.includeGenres,
    includeTags: options?.includeTags,
    authorNames: options?.authorNames,
    scope: options?.scope,
  });

  const volumeMap = new Map(volumes.map((volume) => [volume.id, volume]));

  return {
    ...pagedIds,
    items: pagedIds.items
      .map((id) => volumeMap.get(id))
      .filter((volume): volume is LibraryVolume => Boolean(volume)),
  };
}

export async function listVolumeProgressByIds(
  userId: string,
  volumeIds: string[]
): Promise<Record<string, UserVolumeProgress>> {
  if (!userId || volumeIds.length === 0) {
    return {};
  }

  const rows = await query<{
    id: string;
    user_id: string;
    volume_id: string;
    is_read: boolean;
    is_favorite: boolean;
    personal_rating: number | null;
    last_page: number | null;
    total_pages: number | null;
    last_read_at: Date | null;
    first_read: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `
      SELECT
        id,
        user_id,
        volume_id,
        is_read,
        is_favorite,
        personal_rating,
        last_page,
        total_pages,
        last_read_at,
        first_read,
        created_at,
        updated_at
      FROM user_to_volumes
      WHERE user_id = $1
        AND volume_id = ANY($2::text[])
    `,
    [userId, volumeIds]
  );

  return rows.reduce<Record<string, UserVolumeProgress>>((acc, row) => {
    acc[row.volume_id] = {
      id: row.id,
      userId: row.user_id,
      volumeId: row.volume_id,
      isRead: row.is_read,
      isFavorite: row.is_favorite,
      personalRating: row.personal_rating,
      lastPage: row.last_page,
      totalPages: row.total_pages,
      lastReadAt: row.last_read_at,
      firstRead: row.first_read,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return acc;
  }, {});
}

async function listSeriesWithVolumesRaw(
  options?: SharedSeriesQueryOptions
): Promise<LibrarySeriesWithVolumes[]> {
  const volumes = await listVolumesRaw({
    userId: options?.userId,
    includeGenres: options?.includeGenres,
    includeTags: options?.includeTags,
    authorNames: options?.authorNames,
    genreNames: options?.genreNames,
    tagNames: options?.tagNames,
    seriesIds: options?.seriesIds,
    scope: options?.scope,
  });

  const seriesMap = new Map<string, LibrarySeriesWithVolumes>();

  for (const volume of volumes) {
    const existing = seriesMap.get(volume.series.id);

    if (existing) {
      existing.volumes.push(volume);
      continue;
    }

    seriesMap.set(volume.series.id, {
      ...volume.series,
      volumes: [volume],
    });
  }

  return [...seriesMap.values()];
}

async function listSeriesWithVolumesCached(
  options: SharedSeriesQueryOptions = {}
) {
  "use cache";

  cacheLife("max");
  cacheTag(MANGA_LIBRARY_TAG);

  return listSeriesWithVolumesRaw(options);
}

export async function listSeriesWithVolumes(
  options?: SharedSeriesQueryOptions
): Promise<LibrarySeriesWithVolumes[]> {
  const policy = await getCurrentContentVisibilityPolicy();
  const series = await listSeriesWithVolumesCached({
    authorNames: options?.authorNames,
    genreNames: options?.genreNames,
    tagNames: options?.tagNames,
    seriesIds: options?.seriesIds,
    includeGenres: options?.includeGenres,
    includeTags: options?.includeTags,
    scope: options?.scope,
  });
  return series.map((entry) => ({ ...entry, volumes: filterVisibleVolumes(entry.volumes, policy) })).filter((entry) => entry.volumes.length > 0);
}

async function listPagedSeriesIdsRaw(
  options?: SharedSeriesQueryOptions &
    PagedQueryOptions & {
      excludeOneshots?: boolean;
    }
): Promise<PaginatedResult<string>> {
  const pagination = buildPagination(options);
  const countParams: unknown[] = [];
  const countConditions = buildVolumeFilterSql(
    {
      authorNames: options?.authorNames,
      genreNames: options?.genreNames,
      tagNames: options?.tagNames,
      seriesIds: options?.seriesIds,
      scope: options?.scope,
    },
    countParams
  );

  if (options?.excludeOneshots) {
    countConditions.push("ms.is_oneshot = FALSE");
  }

  const rowsParams = [...countParams];
  const [countRow, rows] = await Promise.all([
    queryOne<{ total: string }>(
      `
        SELECT COUNT(DISTINCT ms.id)::text AS total
        FROM manga_series ms
        INNER JOIN manga_volumes mv ON mv.series_id = ms.id
        LEFT JOIN volume_metadata vm ON vm.id = mv.metadata_id
        ${countConditions.length > 0 ? `WHERE ${countConditions.join(" AND ")}` : ""}
      `,
      countParams
    ),
    query<{ id: string }>(
      `
        SELECT ms.id
        FROM manga_series ms
        INNER JOIN manga_volumes mv ON mv.series_id = ms.id
        LEFT JOIN volume_metadata vm ON vm.id = mv.metadata_id
        ${countConditions.length > 0 ? `WHERE ${countConditions.join(" AND ")}` : ""}
        GROUP BY ms.id, ms.sort_title
        ORDER BY ms.sort_title ASC, ms.id ASC
        LIMIT $${rowsParams.push(pagination.pageSize)}
        OFFSET $${rowsParams.push(pagination.offset)}
      `,
      rowsParams
    ),
  ]);

  return mapPaginatedResult(
    rows.map((row) => row.id),
    parseCount(countRow?.total ?? 0),
    pagination
  );
}

async function listPagedSeriesIdsCached(
  options: SharedSeriesQueryOptions &
    PagedQueryOptions & {
      excludeOneshots?: boolean;
    } = {}
) {
  "use cache";

  cacheLife("max");
  cacheTag(MANGA_LIBRARY_TAG);

  return listPagedSeriesIdsRaw(options);
}

export async function listPagedSeriesWithVolumes(
  options?: SharedSeriesQueryOptions &
    PagedQueryOptions & {
      excludeOneshots?: boolean;
    }
): Promise<PaginatedResult<LibrarySeriesWithVolumes>> {
  const policy = await getCurrentContentVisibilityPolicy();
  if (policy.enabled) {
    const all = await listSeriesWithVolumes({
      authorNames: options?.authorNames,
      genreNames: options?.genreNames,
      tagNames: options?.tagNames,
      seriesIds: options?.seriesIds,
      includeGenres: options?.includeGenres,
      includeTags: options?.includeTags,
      scope: options?.scope,
    });
    const pagination = buildPagination(options);
    return mapPaginatedResult(all.slice(pagination.offset, pagination.offset + pagination.pageSize), all.length, pagination);
  }
  const pagedIds = await listPagedSeriesIdsCached({
    authorNames: options?.authorNames,
    genreNames: options?.genreNames,
    tagNames: options?.tagNames,
    seriesIds: options?.seriesIds,
    includeGenres: options?.includeGenres,
    includeTags: options?.includeTags,
    scope: options?.scope,
    page: options?.page,
    pageSize: options?.pageSize,
    excludeOneshots: options?.excludeOneshots,
  });

  if (pagedIds.items.length === 0) {
    return {
      ...pagedIds,
      items: [],
    };
  }

  const series = await listSeriesWithVolumes({
    seriesIds: pagedIds.items,
    includeGenres: options?.includeGenres,
    includeTags: options?.includeTags,
    authorNames: options?.authorNames,
    scope: options?.scope,
  });

  const seriesMap = new Map(series.map((entry) => [entry.id, entry]));

  return {
    ...pagedIds,
    items: pagedIds.items
      .map((id) => seriesMap.get(id))
      .filter((entry): entry is LibrarySeriesWithVolumes => Boolean(entry)),
  };
}

export async function listSeries(
  options?: { scope?: LibraryScope }
): Promise<LibrarySeries[]> {
  const params: unknown[] = [];
  const conditions = buildVolumeFilterSql(
    {
      scope: options?.scope,
    },
    params
  );

  return query<{
    id: string;
    slug: string;
    sort_title: string;
    title: string;
    path: string;
    is_oneshot: boolean;
    mtime: Date;
    status: string;
    library_section: "manga" | "comic" | "other";
    created_at: Date;
    updated_at: Date;
  }>(
    `
      SELECT DISTINCT
        ms.id,
        ms.slug,
        ms.sort_title,
        ms.title,
        ms.path,
        ms.is_oneshot,
        ms.mtime,
        ms.status,
        ms.library_section,
        ms.created_at,
        ms.updated_at
      FROM manga_series ms
      INNER JOIN manga_volumes mv ON mv.series_id = ms.id
      LEFT JOIN volume_metadata vm ON vm.id = mv.metadata_id
      ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
      ORDER BY ms.sort_title ASC, ms.id ASC
    `,
    params
  ).then((rows) =>
    rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      path: row.path,
      isOneshot: row.is_oneshot,
      mtime: row.mtime,
      status: row.status,
      librarySection: row.library_section,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  );
}

export async function findSeriesBySlugBasic(
  slug: string
): Promise<LibrarySeries | null> {
  const row = await queryOne<{
    id: string;
    slug: string;
    title: string;
    path: string;
    is_oneshot: boolean;
    mtime: Date;
    status: string;
    library_section: "manga" | "comic" | "other";
    created_at: Date;
    updated_at: Date;
  }>(
    `
      SELECT
        id,
        slug,
        title,
        path,
        is_oneshot,
        mtime,
        status,
        library_section,
        created_at,
        updated_at
      FROM manga_series
      WHERE slug = $1
      LIMIT 1
    `,
    [slug]
  );

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    path: row.path,
    isOneshot: row.is_oneshot,
    mtime: row.mtime,
    status: row.status,
    librarySection: row.library_section,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSeriesVolumeAggregates(
  seriesId: string
): Promise<SeriesVolumeAggregate[]> {
  return query<{
    volume_id: string;
      community_rating: number | null;
      age_rating: string | null;
    writer: string | null;
    penciller: string | null;
    inker: string | null;
    colorist: string | null;
    letterer: string | null;
    cover_artist: string | null;
    editor: string | null;
    publisher: string | null;
    imprint: string | null;
    format: string | null;
  }>(
    `
      SELECT
        mv.id AS volume_id,
        vm.community_rating,
        vm.age_rating,
        vm.writer,
        vm.penciller,
        vm.inker,
        vm.colorist,
        vm.letterer,
        vm.cover_artist,
        vm.editor,
        vm.publisher,
        vm.imprint,
        vm.format
      FROM manga_volumes mv
      LEFT JOIN volume_metadata vm ON vm.id = mv.metadata_id
      WHERE mv.series_id = $1
      ORDER BY mv.sort_title ASC, mv.id ASC
    `,
    [seriesId]
  ).then(async (rows) => {
    const policy = await getCurrentContentVisibilityPolicy();
    return rows.filter((row) => canViewAgeRating(row.age_rating, "manga", policy)).map((row) => ({
      id: row.volume_id,
      ageRating: row.age_rating,
      communityRating: row.community_rating,
      writer: row.writer,
      penciller: row.penciller,
      inker: row.inker,
      colorist: row.colorist,
      letterer: row.letterer,
      coverArtist: row.cover_artist,
      editor: row.editor,
      publisher: row.publisher,
      imprint: row.imprint,
      format: row.format,
    }));
  });
}

async function findSeriesBySlugRaw(
  options: FindSeriesOptions
): Promise<LibrarySeriesWithVolumes | null> {
  const row = await queryOne<{ id: string }>(
    `
      SELECT id
      FROM manga_series
      WHERE slug = $1
      LIMIT 1
    `,
    [options.slug]
  );

  if (!row) {
    return null;
  }

  const series = await listSeriesWithVolumesRaw({
    userId: options.userId,
    seriesIds: [row.id],
    includeGenres: options.includeGenres,
    includeTags: options.includeTags,
    scope: options.scope,
  });

  return series[0] ?? null;
}

async function findSeriesBySlugCached(options: FindSeriesOptions) {
  "use cache";

  cacheLife("max");
  cacheTag(MANGA_LIBRARY_TAG);

  return findSeriesBySlugRaw(options);
}

export async function findSeriesBySlug(
  options: FindSeriesOptions
): Promise<LibrarySeriesWithVolumes | null> {
  const series = options.userId ? await findSeriesBySlugRaw(options) : await findSeriesBySlugCached(options);
  if (!series) return null;
  const policy = await getCurrentContentVisibilityPolicy();
  const volumes = filterVisibleVolumes(series.volumes, policy);
  return volumes.length ? { ...series, volumes } : null;
}

async function findVolumeBySlugRaw(
  options: FindVolumeOptions
): Promise<LibraryVolume | null> {
  const row = await queryOne<{ id: string }>(
    `
      SELECT id
      FROM manga_volumes
      WHERE slug = $1
      LIMIT 1
    `,
    [options.slug]
  );

  if (!row) {
    return null;
  }

  const volumes = await listVolumesRaw({
    volumeIds: [row.id],
    userId: options.userId,
    includeGenres: options.includeGenres,
    includeTags: options.includeTags,
    scope: options.scope,
  });

  return volumes[0] ?? null;
}

async function findVolumeBySlugCached(options: FindSeriesOptions) {
  "use cache";

  cacheLife("max");
  cacheTag(MANGA_LIBRARY_TAG);

  return findVolumeBySlugRaw(options);
}

export async function findVolumeBySlug(
  options: FindVolumeOptions
): Promise<LibraryVolume | null> {
  const volume = options.userId ? await findVolumeBySlugRaw(options) : await findVolumeBySlugCached({
    slug: options.slug,
    includeGenres: options.includeGenres,
    includeTags: options.includeTags,
    scope: options.scope,
  });
  if (!volume) return null;
  const policy = await getCurrentContentVisibilityPolicy();
  return canViewAgeRating(volume.metadataObj?.ageRating, "manga", policy) ? volume : null;
}

export async function findVolumePageCountById(
  volumeId: string
): Promise<number | null> {
  const row = await queryOne<{ page_count: number | null }>(
    `
      SELECT vm.page_count
      FROM manga_volumes mv
      LEFT JOIN volume_metadata vm ON vm.id = mv.metadata_id
      WHERE mv.id = $1
      LIMIT 1
    `,
    [volumeId]
  );

  return row?.page_count ?? null;
}

export async function listFavoriteSeriesIds(userId: string): Promise<string[]> {
  const rows = await query<{ series_id: string }>(
    `
      SELECT series_id
      FROM user_to_series
      WHERE user_id = $1
        AND is_favorite = TRUE
      ORDER BY series_id ASC
    `,
    [userId]
  );

  return rows.map((row) => row.series_id);
}

export async function listFavoriteVolumeIds(userId: string): Promise<string[]> {
  const rows = await query<{ volume_id: string }>(
    `
      SELECT volume_id
      FROM user_to_volumes
      WHERE user_id = $1
        AND is_favorite = TRUE
      ORDER BY volume_id ASC
    `,
    [userId]
  );

  return rows.map((row) => row.volume_id);
}
