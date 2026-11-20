import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import * as fs from "node:fs/promises";
import { constants } from "node:fs";
import os from "node:os";
import path from "node:path";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { getConvertedSeriesPath } from "../src/lib/seriesConversion.ts";

function load(file, dependencies) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const script = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const exports = {};
  runInNewContext(script, {
    exports, console: { error() {} }, process: { env: { LIB_PROVIDER: "local" }, cwd: () => "/demo/app" },
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected import: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

test("conversion adds and removes only the oneshot suffix in the folder name", () => {
  assert.equal(getConvertedSeriesPath("/library/manga/Series", true), "/library/manga/Series [oneshot]");
  assert.equal(getConvertedSeriesPath("/library/books/A [ONESHOT]", false), "/library/books/A");
  assert.equal(getConvertedSeriesPath("/library/comic/A [oneshot]", true), "/library/comic/A [oneshot]");
  assert.equal(getConvertedSeriesPath("/library/others/A [oneshot] extras", false), null);
});

test("local copies preserve the source and refuse to overwrite or delete changed files", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "bunko-conversion-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const from = path.join(root, "Volume");
  const to = path.join(root, "Volume [oneshot]");
  await fs.mkdir(path.join(from, "extras"), { recursive: true });
  await fs.writeFile(path.join(from, "book.epub"), "EPUB contents");
  await fs.writeFile(path.join(from, "extras", "cover.png"), "Cover contents");
  const storage = load("../src/lib/seriesConversionStorage.ts", {
    "node:fs": { constants }, "node:fs/promises": fs, "node:path": path,
    "@aws-sdk/client-s3": {}, "./r2": {},
  });
  const originals = await storage.listConversionFiles(from, "local");
  await storage.assertConversionDestination(to, "local");
  await storage.createConversionDestination(to, "local");
  await assert.rejects(storage.assertConversionDestination(to, "local"), /destinationExists/);
  for (const file of originals) await storage.copyConversionFile(from, to, "local", file);
  assert.equal(await fs.readFile(path.join(from, "book.epub"), "utf8"), "EPUB contents");
  assert.equal(await fs.readFile(path.join(to, "extras", "cover.png"), "utf8"), "Cover contents");
  await assert.rejects(storage.copyConversionFile(from, to, "local", originals[0]), { code: "EEXIST" });
  await fs.writeFile(path.join(from, "book.epub"), "changed after copying");
  await assert.rejects(storage.removeConversionFiles(from, "local", originals), /storageChanged/);
  assert.equal(await fs.readFile(path.join(from, "book.epub"), "utf8"), "changed after copying");
  assert.equal(await fs.readFile(path.join(to, "book.epub"), "utf8"), "EPUB contents");
});

test("an EPUB collection keeps its metadata while the folder controls oneshot conversion", async () => {
  const updates = [];
  const { indexBook } = load("../src/lib/books/indexer.ts", {
    "node:path": path,
    "./epubParser": { parseEpubBuffer: async () => ({ metadata: {
      collection: { title: "Collection", position: 1, type: "series" },
      people: [], subjects: [], identifiers: [],
    } }) },
    "./storage": { readBookFile: async () => Buffer.alloc(0) },
    "@/lib/db/books/library": { upsertBook: async (input) => updates.push(input) },
  });
  for (const seriesName of ["Collection [oneshot]", "Collection"]) {
    await indexBook({ seriesName, filename: "work.epub", fullPath: `/${seriesName}/work.epub`, seriesPath: `/${seriesName}` });
  }
  assert.deepEqual(updates.map((entry) => entry.isOneshot), [true, false]);
  assert.deepEqual(updates.map((entry) => entry.seriesSlug), ["collection", "collection"]);
  assert.deepEqual(updates.map((entry) => entry.collectionType), ["series", "series"]);
});

function conversionHarness({ extraVolume = false, fail = false } = {}) {
  const source = "/demo/library/others/Work";
  const target = `${source} [oneshot]`;
  const stored = [
    { name: "book.epub", size: 4, revision: "original" },
    { name: "cover.jpg", size: 5, revision: "cover" },
  ];
  const copies = [];
  const mutations = [];
  const writes = [];
  const archiveSeries = { id: "archive-series", path: source, library_section: "other", is_oneshot: false, is_logical: false };
  const bookSeries = { ...archiveSeries, id: "book-series" };
  const client = {
    query: async (sql) => mutations.push(sql),
    release() {},
  };
  const { convertSeriesStorage } = load("../src/lib/db/seriesConversion.ts", {
    "node:path": path,
    "@/lib/seriesConversion": { getConvertedSeriesPath },
    "./pool": { getPool: () => ({ connect: async () => client }) },
    "./libraryStorageLock": { withLibraryStorageLock: (callback) => callback() },
    "./query": {
      queryOne: async (sql) => sql.includes("JOIN") ? archiveSeries : null,
      query: async (sql, params) => {
        if (sql.includes("library_conversions")) return [];
        if (sql.includes("WHERE path IN")) return [sql.includes("book_series") ? bookSeries : archiveSeries];
        const series = sql.includes("book_volumes") ? bookSeries : archiveSeries;
        if (params[0] === target) return [];
        const result = [{ series_id: series.id, full_path: `${source}/book.epub` }];
        if (extraVolume) result.push({ series_id: series.id, full_path: `${source}/extra.epub` });
        return result;
      },
      execute: async (sql, params, executor) => {
        mutations.push(sql.trim());
        if (executor && !sql.includes("library_conversions")) writes.push({ sql, params });
        if (fail && sql.includes("UPDATE volume_metadata")) throw new Error("database error");
      },
    },
    "@/lib/seriesConversionStorage": {
      listConversionFiles: async (folder) => folder === source ? stored : copies,
      assertConversionDestination: async () => {},
      createConversionDestination: async () => mutations.push("CREATE TARGET"),
      copyConversionFile: async (_from, _to, _provider, file) => {
        const copied = { ...file, revision: `copy-${file.revision}` };
        copies.push(copied);
        return copied;
      },
      removeConversionFiles: async (folder) => mutations.push(`REMOVE ${folder}`),
    },
  });
  return {
    convert: () => convertSeriesStorage({ volumeId: "archive-id", section: "others", oneshot: true, expectedPath: source }),
    mutations, writes, source, target,
  };
}

test("conversion updates both records for a mirrored EPUB and only retires the source after commit", async () => {
  const { convert, mutations, source } = conversionHarness();
  assert.equal((await convert()).cleanupPending, false);
  for (const table of ["library_series", "book_series", "library_volumes", "book_volumes", "volume_metadata", "file_checksums", "book_file_checksums"]) {
    assert.ok(mutations.some((sql) => sql.startsWith(`UPDATE ${table} SET`)), table);
  }
  assert.ok(mutations.indexOf("COMMIT") < mutations.indexOf(`REMOVE ${source}`));
  assert.ok(mutations.every((sql) => !/(?:DELETE FROM|INSERT INTO) (library_volumes|book_volumes|user_to_volumes|user_to_books|reading_entries)/.test(sql)));
});

test("multi-volume series are rejected before copying and database failures retain the source", async () => {
  const multi = conversionHarness({ extraVolume: true });
  await assert.rejects(multi.convert(), /requiresOneVolume/);
  assert.ok(!multi.mutations.includes("CREATE TARGET"));
  const failed = conversionHarness({ fail: true });
  await assert.rejects(failed.convert(), /database error/);
  assert.ok(failed.mutations.includes("ROLLBACK"));
  assert.ok(failed.mutations.includes(`REMOVE ${failed.target}`));
  assert.ok(!failed.mutations.includes(`REMOVE ${failed.source}`));
});

test("PostgreSQL keeps both kinds of reading progress when converting a mirrored EPUB", async () => {
  const { convert, writes, source, target } = conversionHarness();
  await convert();
  const directory = new URL("../src/lib/db/migrations/", import.meta.url);
  const migrations = readdirSync(directory).filter((name) => name.endsWith(".sql")).sort().map((name) => {
    const sql = readFileSync(new URL(name, directory), "utf8");
    return name === "005_unify_comic_library.sql"
      ? `ALTER TABLE library_series RENAME CONSTRAINT library_series_library_section_check TO manga_series_library_section_check;\n${sql}`
      : sql;
  });
  const statements = writes.map(({ sql, params }) => {
    const values = params.map((value) => typeof value === "boolean" ? String(value) : `'${value.replaceAll("'", "''")}'`);
    return `PREPARE conversion_write AS ${sql};
      EXECUTE conversion_write(${values.join(",")}); DEALLOCATE conversion_write;`;
  });
  const fixture = `
    INSERT INTO users (id, username, password) VALUES ('reader', 'reader', 'unused');
    INSERT INTO library_series (id, slug, title, sort_title, path, library_section)
      VALUES ('archive-series', 'work', 'Work', 'work', '${source}', 'other');
    INSERT INTO book_series (id, slug, title, sort_title, path, library_section, collection_type)
      VALUES ('book-series', 'work', 'Work', 'work', '${source}', 'other', 'series');
    INSERT INTO volume_metadata (id, file_path) VALUES ('metadata', '${source}/book.epub');
    INSERT INTO library_volumes (id, slug, title, sort_title, filename, full_path, series_id, metadata_id)
      VALUES ('archive-id', 'work', 'Work', 'work', 'book.epub', '${source}/book.epub', 'archive-series', 'metadata');
    INSERT INTO book_volumes (id, slug, title, sort_title, filename, full_path, series_id)
      VALUES ('book-id', 'work', 'Work', 'work', 'book.epub', '${source}/book.epub', 'book-series');
    INSERT INTO user_to_volumes (id, user_id, volume_id, last_page, total_pages, personal_rating)
      VALUES ('archive-progress', 'reader', 'archive-id', 12, 20, 8.5);
    INSERT INTO user_to_books (id, user_id, volume_id, cfi, progression, personal_rating)
      VALUES ('book-progress', 'reader', 'book-id', 'epubcfi(/6/4)', 0.6, 9);
    INSERT INTO reading_entries (id, user_id, volume_id, read_at) VALUES ('archive-history', 'reader', 'archive-id', '2026-10-01');
    INSERT INTO book_reading_entries (id, user_id, volume_id, read_at) VALUES ('book-history', 'reader', 'book-id', '2026-10-01');
    INSERT INTO file_checksums (id, file_path, checksum) VALUES ('archive-check', '${source}/book.txt', 'check');
    INSERT INTO book_file_checksums (id, file_path, checksum) VALUES ('book-check', '${source}/book.epub', 'check');
  `;
  const assertions = `DO $$ BEGIN
    ASSERT (SELECT is_oneshot AND path = '${target}' FROM library_series WHERE id = 'archive-series' AND slug = 'work');
    ASSERT (SELECT is_oneshot AND path = '${target}' AND collection_type = 'series' FROM book_series WHERE id = 'book-series' AND slug = 'work');
    ASSERT (SELECT full_path = '${target}/book.epub' FROM library_volumes WHERE id = 'archive-id');
    ASSERT (SELECT full_path = '${target}/book.epub' FROM book_volumes WHERE id = 'book-id');
    ASSERT (SELECT file_path = '${target}/book.epub' FROM volume_metadata WHERE id = 'metadata');
    ASSERT (SELECT file_path = '${target}/book.txt' FROM file_checksums WHERE id = 'archive-check');
    ASSERT (SELECT file_path = '${target}/book.epub' FROM book_file_checksums WHERE id = 'book-check');
    ASSERT (SELECT last_page = 12 AND personal_rating = 8.5 FROM user_to_volumes WHERE volume_id = 'archive-id');
    ASSERT (SELECT cfi = 'epubcfi(/6/4)' AND progression = 0.6 AND personal_rating = 9 FROM user_to_books WHERE volume_id = 'book-id');
    ASSERT EXISTS (SELECT 1 FROM reading_entries WHERE id = 'archive-history' AND volume_id = 'archive-id');
    ASSERT EXISTS (SELECT 1 FROM book_reading_entries WHERE id = 'book-history' AND volume_id = 'book-id');
  END $$;`;
  const result = spawnSync("docker", ["run", "--rm", "--network", "none", "--user", "postgres", "-i", "postgres:16", "bash", "-ec", `
    initdb -D /tmp/bunko-test -A trust >/dev/null
    pg_ctl -D /tmp/bunko-test -o "-k /tmp -c listen_addresses=''" -w start >/dev/null
    trap 'pg_ctl -D /tmp/bunko-test -m immediate stop >/dev/null' EXIT
    psql -h /tmp -U postgres -v ON_ERROR_STOP=1 -q
  `], { input: [...migrations, fixture, ...statements, assertions].join("\n"), encoding: "utf8", timeout: 60000 });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
});

test("R2 copies use source and destination conditions and check the copied object", async () => {
  const commands = [];
  class Command {
    constructor(input) { this.input = input; }
  }
  class CopyObjectCommand extends Command {
    middlewareStack = { add: (middleware) => { this.middleware = middleware; } };
  }
  class HeadObjectCommand extends Command {}
  class ListObjectsV2Command extends Command {}
  const storage = load("../src/lib/seriesConversionStorage.ts", {
    "node:fs": { constants }, "node:fs/promises": fs, "node:path": path,
    "@aws-sdk/client-s3": { CopyObjectCommand, HeadObjectCommand, ListObjectsV2Command },
    "./r2": {
      __esModule: true, R2_BUCKET: "bucket",
      default: { send: async (command) => {
        commands.push(command);
        if (command instanceof CopyObjectCommand) return { CopyObjectResult: { ETag: '"copied"' } };
        if (command instanceof HeadObjectCommand) return { ETag: '"copied"', ContentLength: 14 };
        if (!command.input.ContinuationToken) return {
          Contents: [{ Key: "library/comic/Series/Vol 1.cbz", ETag: '"original"', Size: 14 }],
          IsTruncated: true, NextContinuationToken: "next",
        };
        return { Contents: [{ Key: "library/comic/Series/cover.jpg", ETag: '"cover"', Size: 12 }] };
      } },
    },
  });
  const source = "/library/comic/Series";
  const target = "/library/comic/Series [oneshot]";
  const files = await storage.listConversionFiles(source, "cloud");
  assert.equal(files.length, 2);
  const copied = await storage.copyConversionFile(source, target, "cloud", files[0]);
  const copy = commands.find((command) => command instanceof CopyObjectCommand);
  assert.equal(copy.input.CopySource, "bucket/library/comic/Series/Vol%201.cbz");
  assert.equal(copy.input.CopySourceIfMatch, '"original"');
  assert.equal(copy.input.Key, "library/comic/Series [oneshot]/Vol 1.cbz");
  assert.equal(copied.revision, '"copied"');
  const request = { headers: {} };
  await copy.middleware(async () => ({}))({ request });
  assert.equal(request.headers["cf-copy-destination-if-none-match"], "*");
});
