import { query, queryOne } from "./query";

export interface GenreFilter {
  id: string;
  name: string;
}

export interface TagFilter {
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
    genreNames?: string[];
    tagNames?: string[];
    seriesIds?: string[];
    volumeIds?: string[];
    userId?: string | null;
    onlyUnreadForUser?: boolean;
  },
  params: unknown[]
): string[] {
  const conditions: string[] = [];

  if (options.seriesIds && options.seriesIds.length > 0) {
    params.push(options.seriesIds);
    conditions.push(`mv.series_id = ANY($${params.length}::text[])`);
  }

  if (options.volumeIds && options.volumeIds.length > 0) {
    params.push(options.volumeIds);
    conditions.push(`mv.id = ANY($${params.length}::text[])`);
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

export async function listLibraryFilters(): Promise<{
  genres: GenreFilter[];
  tags: TagFilter[];
}> {
  const [genres, tags] = await Promise.all([
    query<GenreFilter>(
      `
        SELECT id, name
        FROM genres
        ORDER BY name ASC
      `
    ),
    query<TagFilter>(
      `
        SELECT id, name
        FROM tags
        ORDER BY name ASC
      `
    ),
  ]);

  return { genres, tags };
}

export async function listVolumes(options?: {
  userId?: string | null;
  includeGenres?: boolean;
  includeTags?: boolean;
  genreNames?: string[];
  tagNames?: string[];
  seriesIds?: string[];
  volumeIds?: string[];
  onlyUnreadForUser?: boolean;
}): Promise<LibraryVolume[]> {
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
      genreNames: options?.genreNames,
      tagNames: options?.tagNames,
      seriesIds: options?.seriesIds,
      volumeIds: options?.volumeIds,
      userId: options?.userId,
      onlyUnreadForUser: options?.onlyUnreadForUser,
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
      ORDER BY ms.title ASC, mv.title ASC
    `,
    params
  );

  const volumes = rows.map(mapVolume);
  return attachVolumeRelations(volumes, {
    includeGenres: options?.includeGenres,
    includeTags: options?.includeTags,
  });
}

export async function listSeriesWithVolumes(options?: {
  genreNames?: string[];
  tagNames?: string[];
  seriesIds?: string[];
  includeGenres?: boolean;
  includeTags?: boolean;
}): Promise<LibrarySeriesWithVolumes[]> {
  const volumes = await listVolumes({
    includeGenres: options?.includeGenres,
    includeTags: options?.includeTags,
    genreNames: options?.genreNames,
    tagNames: options?.tagNames,
    seriesIds: options?.seriesIds,
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

export async function listSeries(): Promise<LibrarySeries[]> {
  return query<{
    id: string;
    slug: string;
    title: string;
    path: string;
    is_oneshot: boolean;
    mtime: Date;
    status: string;
    created_at: Date;
    updated_at: Date;
  }>(
    `
      SELECT id, slug, title, path, is_oneshot, mtime, status, created_at, updated_at
      FROM manga_series
      ORDER BY title ASC
    `
  ).then((rows) =>
    rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      path: row.path,
      isOneshot: row.is_oneshot,
      mtime: row.mtime,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  );
}

export async function findSeriesBySlug(options: {
  slug: string;
  includeGenres?: boolean;
  includeTags?: boolean;
}): Promise<LibrarySeriesWithVolumes | null> {
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

  const series = await listSeriesWithVolumes({
    seriesIds: [row.id],
    includeGenres: options.includeGenres,
    includeTags: options.includeTags,
  });

  return series[0] ?? null;
}

export async function findVolumeBySlug(options: {
  slug: string;
  userId?: string | null;
  includeGenres?: boolean;
  includeTags?: boolean;
}): Promise<LibraryVolume | null> {
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

  const volumes = await listVolumes({
    volumeIds: [row.id],
    userId: options.userId,
    includeGenres: options.includeGenres,
    includeTags: options.includeTags,
  });

  return volumes[0] ?? null;
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
