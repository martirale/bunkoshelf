import path from "node:path";
import { getConvertedSeriesPath } from "@/lib/seriesConversion";
import {
  assertConversionDestination, copyConversionFile, createConversionDestination, listConversionFiles, removeConversionFiles,
  type ConversionFile,
} from "@/lib/seriesConversionStorage";
import type { OneshotSection } from "@/lib/librarySection";
import type { StorageProvider } from "@/lib/types/manga";
import { getPool } from "./pool";
import { execute, query, queryOne, type QueryExecutor } from "./query";
import { withLibraryStorageLock } from "./libraryStorageLock";

const tables = {
  archives: { series: "library_series", volumes: "library_volumes", members: "logical_series_members" },
  books: { series: "book_series", volumes: "book_volumes", members: "logical_book_series_members" },
} as const;

type Kind = keyof typeof tables;

interface SeriesRow {
  id: string;
  path: string;
  library_section: string;
  is_oneshot: boolean;
  is_logical: boolean;
}

interface ConversionRow {
  source_path: string;
  target_path: string;
  provider: StorageProvider;
  target_created: boolean;
  committed: boolean;
  source_files: ConversionFile[];
  target_files: ConversionFile[];
}

async function readSeries(kind: Kind, volumeId: string, client: QueryExecutor) {
  const table = tables[kind];
  return queryOne<SeriesRow>(`
    SELECT s.id, s.path, s.library_section, s.is_oneshot, s.is_logical
    FROM ${table.series} s JOIN ${table.volumes} v ON v.series_id = s.id
    WHERE v.id = $1 FOR UPDATE OF s
  `, [volumeId], client);
}

async function directorySeries(kind: Kind, source: string, target: string, client: QueryExecutor) {
  return query<SeriesRow>(`
    SELECT id, path, library_section, is_oneshot, is_logical
    FROM ${tables[kind].series} WHERE path IN ($1, $2) FOR UPDATE
  `, [source, target], client);
}

async function directoryVolumes(kind: Kind, folder: string, client: QueryExecutor) {
  return query<{ full_path: string; series_id: string }>(`
    SELECT full_path, series_id FROM ${tables[kind].volumes}
    WHERE starts_with(full_path, $1 || '/') ORDER BY full_path FOR UPDATE
  `, [folder], client);
}

async function checkSeries(kind: Kind, rows: SeriesRow[], source: string, target: string, oneshot: boolean, client: QueryExecutor) {
  if (source !== target && rows.some((row) => row.path === target)) throw new Error("destinationExists");
  if (rows.length > 1 || rows.some((row) => row.is_logical)) throw new Error("sharedDirectory");
  const series = rows[0];
  const volumes = await directoryVolumes(kind, source, client);
  if (source !== target && (await directoryVolumes(kind, target, client)).length) throw new Error("destinationExists");
  if (!series && !volumes.length) return [];
  if (!series || !volumes.length || volumes.some((volume) => volume.series_id !== series.id)) throw new Error("sharedDirectory");

  const allVolumes = await query<{ full_path: string }>(`SELECT full_path FROM ${tables[kind].volumes} WHERE series_id = $1 FOR UPDATE`, [series.id], client);
  if (oneshot && allVolumes.length !== 1) throw new Error("requiresOneVolume");
  if (allVolumes.length !== volumes.length) throw new Error("sharedDirectory");

  const member = await queryOne(`SELECT 1 FROM ${tables[kind].members} WHERE series_id = $1`, [series.id], client);
  if (member) throw new Error("logicalMember");
  return allVolumes.map((volume) => volume.full_path);
}

function sameFiles(expected: ConversionFile[], current: ConversionFile[]) {
  const registered = new Map(current.map((file) => [file.name, file]));
  return expected.length === registered.size && expected.every((file) => {
    const actual = registered.get(file.name);
    return actual?.revision === file.revision && actual.size === file.size;
  });
}

async function cleanConversion(row: ConversionRow): Promise<boolean> {
  try {
    if (!row.committed && row.provider === "local" && !row.target_created) {
      await assertConversionDestination(row.target_path, row.provider);
    } else {
      const retainedPath = row.committed ? row.target_path : row.source_path;
      const retainedFiles = row.committed ? row.target_files : row.source_files;
      if (!sameFiles(retainedFiles, await listConversionFiles(retainedPath, row.provider))) {
        throw new Error("verificationFailed");
      }
      await removeConversionFiles(
        row.committed ? row.source_path : row.target_path,
        row.provider,
        row.committed ? row.source_files : row.target_files,
      );
    }
    await execute("DELETE FROM library_conversions WHERE source_path = $1", [row.source_path]);
    return true;
  } catch (error) {
    console.error("Library conversion cleanup pending:", error);
    return false;
  }
}

export async function recoverLibraryConversions() {
  const pending = await query<ConversionRow>("SELECT * FROM library_conversions");
  for (const operation of pending) await cleanConversion(operation);
}

async function updatePaths(source: string, target: string, oneshot: boolean, client: QueryExecutor) {
  for (const table of Object.values(tables)) {
    await execute(`UPDATE ${table.series} SET path = $2, is_oneshot = $3, updated_at = NOW() WHERE path = $1`, [source, target, oneshot], client);
    await execute(`
      UPDATE ${table.volumes} SET full_path = $2 || substr(full_path, length($1) + 1), updated_at = NOW()
      WHERE starts_with(full_path, $1 || '/')
    `, [source, target], client);
  }

  for (const table of ["volume_metadata", "file_checksums", "book_file_checksums"]) {
    await execute(`
      UPDATE ${table} SET file_path = $2 || substr(file_path, length($1) + 1)
      WHERE starts_with(file_path, $1 || '/')
    `, [source, target], client);
  }
}

function isManagedDirectory(source: string, section: string, provider: StorageProvider) {
  const directory = section === "other" ? "others" : section;
  const root = provider === "cloud" ? `/library/${directory}` : path.resolve(process.cwd(), "../library", directory);
  return source.startsWith(`${root}/`) && path.posix.normalize(source) === source && !source.endsWith("/");
}

export async function convertSeriesStorage(input: {
  volumeId: string;
  section: OneshotSection;
  oneshot: boolean;
  expectedPath: string;
}) {
  return withLibraryStorageLock(async () => {
    await recoverLibraryConversions();

    const provider = process.env.LIB_PROVIDER === "cloud" ? "cloud" : "local";
    const kind = input.section === "books" ? "books" : "archives";
    const client = await getPool().connect();
    let journal: ConversionRow | undefined;
    let commitAttempted = false;
    let committed = false;
    try {
      await client.query("BEGIN");
      const series = await readSeries(kind, input.volumeId, client);
      const section = input.section === "others" ? "other" : input.section;
      if (!series || series.path !== input.expectedPath || series.is_oneshot === input.oneshot
        || (series.library_section !== section && !(kind === "books" && series.library_section === "other"))) {
        throw new Error("staleConversion");
      }
      const source = series.path;
      const target = getConvertedSeriesPath(source, input.oneshot);
      if (!target || !isManagedDirectory(source, series.library_section, provider)) throw new Error("unsafeStorage");
      const remaining = await queryOne(
        "SELECT 1 FROM library_conversions WHERE source_path IN ($1, $2) OR target_path IN ($1, $2)",
        [source, target], client,
      );
      if (remaining) throw new Error("pendingCleanup");
      const archives = await directorySeries("archives", source, target, client);
      const books = await directorySeries("books", source, target, client);
      if (series.library_section !== "other" && archives.length + books.length !== 1) {
        if ([...archives, ...books].some((row) => row.path === target)) throw new Error("destinationExists");
        throw new Error("sharedDirectory");
      }
      const archivePaths = await checkSeries("archives", archives, source, target, input.oneshot, client);
      const bookPaths = await checkSeries("books", books, source, target, input.oneshot, client);
      if (archivePaths.length && bookPaths.length && (
        archivePaths.length !== bookPaths.length || bookPaths.some((file) => !archivePaths.includes(file))
      )) throw new Error("sharedDirectory");

      const recorded = new Set([...archivePaths, ...bookPaths].map((file) => file.slice(source.length + 1)));
      const sourceFiles = await listConversionFiles(source, provider);
      const actual = new Set(sourceFiles.filter((file) => /\.(cbz|zip|cbr|rar|epub)$/i.test(file.name)).map((file) => file.name));
      if (input.oneshot && actual.size !== 1) throw new Error("requiresOneVolume");
      if (actual.size !== recorded.size || [...recorded].some((file) => !actual.has(file))) throw new Error("storageChanged");
      if (source === target) {
        await updatePaths(source, target, input.oneshot, client);
        await client.query("COMMIT");
        return { cleanupPending: false };
      }
      await assertConversionDestination(target, provider);

      await execute(
        "INSERT INTO library_conversions (source_path, target_path, provider, source_files) VALUES ($1, $2, $3, $4::jsonb)",
        [source, target, provider, JSON.stringify(sourceFiles)],
      );
      journal = { source_path: source, target_path: target, provider, source_files: sourceFiles, target_files: [], target_created: false, committed: false };
      await createConversionDestination(target, provider);
      journal.target_created = true;
      await execute("UPDATE library_conversions SET target_created = TRUE WHERE source_path = $1", [source]);
      for (const file of sourceFiles) {
        journal.target_files.push(await copyConversionFile(source, target, provider, file));
        await execute("UPDATE library_conversions SET target_files = $2::jsonb WHERE source_path = $1",
          [source, JSON.stringify(journal.target_files)]);
      }
      if (!sameFiles(sourceFiles, await listConversionFiles(source, provider))
        || !sameFiles(journal.target_files, await listConversionFiles(target, provider))) throw new Error("storageChanged");

      await updatePaths(source, target, input.oneshot, client);
      await execute("UPDATE library_conversions SET committed = TRUE WHERE source_path = $1", [source], client);
      commitAttempted = true;
      await client.query("COMMIT");
      committed = true;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      if (journal && !commitAttempted) await cleanConversion(journal);
      throw error;
    } finally {
      client.release();
    }
    return { cleanupPending: !!journal && committed && !(await cleanConversion({ ...journal, committed: true })) };
  });
}
