import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsxRuntime from "react/jsx-runtime";
import { ageRatingMap, comicAgeRatingMinimum } from "../src/lib/mangaMetadata.ts";
import { canViewAgeRating } from "../src/lib/parentalControl.ts";

function load(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const ts = dependencies.typescript;
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  runInNewContext(compiled, { exports, URLSearchParams, require: (name) => dependencies[name] ?? {} });
  return exports;
}

const { default: ts } = await import("typescript");
const libraryFilters = load("../src/lib/libraryFilters.ts", { typescript: ts });
const catalogFilters = load("../src/lib/catalogFilters.ts", { typescript: ts, "./libraryFilters": libraryFilters, "./mangaMetadata": { ageRatingMap, comicAgeRatingMinimum } });
const unrestricted = { enabled: false, maxAge: null, allowUnrated: true };

function databaseModules({ rows = [], policy = unrestricted } = {}) {
  const calls = [];
  const database = {
    query: async (sql, params = []) => { calls.push({ sql, params, kind: "rows" }); return rows; },
    queryOne: async (sql, params = []) => { calls.push({ sql, params, kind: "count" }); return { total: "0" }; },
  };
  const shared = {
    typescript: ts,
    "@/lib/parentalControlServer": { getCurrentContentVisibilityPolicy: async () => policy },
    "@/lib/parentalControl": { canViewAgeRating },
  };
  return {
    calls,
    library: load("../src/lib/db/library.ts", {
      ...shared,
      "./query": database,
      "next/cache": { cacheLife() {}, cacheTag() {} },
      "@/lib/catalogFilters": catalogFilters,
      "@/lib/librarySection": { getLibrarySection: (section) => section === "other" ? "others" : section },
    }),
    books: load("../src/lib/db/books/library.ts", { ...shared, "../query": database }),
  };
}

const groups = [
  { key: "author", commaSeparated: true },
  { key: "genre", commaSeparated: true },
  { key: "tag", commaSeparated: true },
  { key: "publisher" },
];

test("library headings use the applied filters and localized shortcut labels", () => {
  const title = (query, section = "manga", lang = "es") => {
    const { libraries } = JSON.parse(readFileSync(new URL(`../src/lib/i18n/dictionaries/${lang}/libraries.json`, import.meta.url)));
    const { catalog } = JSON.parse(readFileSync(new URL(`../src/lib/i18n/dictionaries/${lang}/catalog.json`, import.meta.url)));
    const selection = libraryFilters.readFilterSelection(new URLSearchParams(query), groups);
    return libraryFilters.getLibraryFilterTitle(selection, "Default", lang, section, libraries.comicTypes, catalog.unknownAuthor);
  };

  assert.equal(title("page=2&includeOneshots=true"), "Default");
  assert.equal(title("tag=shojo&includeOneshots=true"), "Shōjo");
  assert.equal(title("tag=graphic+novel", "comic"), "Novela Gráfica");
  assert.equal(title("tag=c%C3%B3mic", "comic", "en"), "Comic");
  assert.equal(title("author=Milk+Morinaga", "others"), "Milk Morinaga");
  assert.equal(title("author=__unknown__", "books"), "Desconocido");
  assert.equal(title("author=Milk+Morinaga&tag=shojo"), "Milk Morinaga y Shōjo");
  assert.equal(title("genre=romance&publisher=Publisher%2C+Inc.", "books", "en"), "Romance and Publisher, Inc.");
});

test("filter URLs preserve publisher punctuation, legacy selections and unrelated flags", () => {
  const params = new URLSearchParams("author=First,Second&genre=Drama&includeOneshots=true&page=4");
  params.append("publisher", "Publisher, Inc.");
  params.append("publisher", "O'Reilly & Co");
  const selection = libraryFilters.readFilterSelection(params, groups);
  assert.deepEqual([...selection.publisher], ["Publisher, Inc.", "O'Reilly & Co"]);
  assert.deepEqual([...selection.author], ["First", "Second"]);
  const applied = libraryFilters.updateFilterParams(params, groups, selection);
  assert.equal(applied.get("page"), "1");
  assert.equal(applied.get("includeOneshots"), "true");
  assert.deepEqual(applied.getAll("publisher"), ["Publisher, Inc.", "O'Reilly & Co"]);
  const cleared = libraryFilters.updateFilterParams(applied, groups, {});
  assert.equal(cleared.toString(), "includeOneshots=true&page=1");
});

test("catalog filters combine seven categories with parameterized values", async () => {
  const filters = catalogFilters.parseCatalogFilters({
    series: "manga:series", author: ["First", "Second"], year: "2024", publisher: ["Publisher, Inc.", "O'Reilly"], age: "13+", language: "es", type: ["manga", "books"],
  });
  const { library, calls } = databaseModules();
  await library.listPagedCatalogLibraryVolumes({ page: 3, pageSize: 1, filters });
  const count = calls.find((call) => call.kind === "count");
  const rows = calls.find((call) => call.kind === "rows");
  const expectedValues = Object.values(filters);
  expectedValues[4] = ["13+", "Teen"];
  assert.equal(JSON.stringify(count.params.slice(1)), JSON.stringify(expectedValues));
  assert.deepEqual([...rows.params.slice(-2)], [1, 2]);
  assert.equal(rows.params.length, count.params.length + 2);
  assert.ok(rows.sql.indexOf("WHERE library_section ||") < rows.sql.lastIndexOf("LIMIT"));
  assert.match(count.sql, /COUNT\(\*\) AS total FROM catalog_volumes/);
  assert.match(count.sql, /BTRIM\(author.name\) = ANY/);
  assert.ok(!rows.sql.includes("O'Reilly"));
});

test("publisher selection reaches paged, cached, unread, series and parental visibility paths", async () => {
  for (const policy of [unrestricted, { enabled: true, maxAge: 12, allowUnrated: false }]) {
    const { library, books, calls } = databaseModules({ policy });
    for (const [method, options] of [
      [library.listVolumes, {}],
      [library.listPagedVolumes, {}],
      [library.listPagedVolumes, { userId: "reader", onlyUnreadForUser: true }],
      [library.listSeriesWithVolumes, {}],
      [library.listPagedSeriesWithVolumes, {}],
    ]) {
      calls.length = 0;
      await method({ scope: "manga", publisherNames: ["Publisher, Inc."], ...options });
      assert.ok(calls.length);
      for (const { sql, params } of calls) {
        assert.match(sql, /BTRIM\(vm.publisher\) = ANY/);
        assert.ok(params.some((param) => Array.isArray(param) && param.includes("Publisher, Inc.")));
      }
    }
    calls.length = 0;
    await books.listBookVolumes({ publisherNames: ["Publisher, Inc."] });
    assert.match(calls[0].sql, /BTRIM\(bm.publisher\) = ANY/);
  }
});

test("catalog options cover every visible work and omit empty values", async () => {
  const rows = [
    { series_slug: "same", series: "Alternate series", writer: "First, Second", publisher: " Publisher, Inc. ", year: 2024, language_iso: "es", age_rating: "Everyone", library_section: "manga" },
    { series_slug: "same", series: "Book series", writer: " ", publisher: "Other publisher", year: null, language_iso: "en", age_rating: "0+", library_section: "books" },
    { series_slug: "adult", series: "Hidden series", writer: "Hidden author", publisher: "Hidden publisher", year: 2025, language_iso: "ja", age_rating: "Adults Only 18+", library_section: "comic" },
  ];
  const { library, calls } = databaseModules({ rows, policy: { enabled: true, maxAge: 12, allowUnrated: false } });
  const options = await library.listCatalogLibraryFilterOptions();
  assert.deepEqual([...options.series.map((option) => option.value)].sort(), ["books:same", "manga:same"]);
  assert.deepEqual([...options.author.map((option) => option.value)].sort(), ["First", "Second", "__unknown__"].sort());
  assert.deepEqual([...options.publisher.map((option) => option.value)].sort(), ["Other publisher", "Publisher, Inc."]);
  assert.deepEqual([...options.age.map((option) => option.value)], ["0+"]);
  assert.ok(!/FROM catalog_volumes\s+LIMIT/.test(calls[0].sql));
});

test("age filters show unique numeric ages and match equivalent metadata ratings", async () => {
  const ratings = ["0+", "Everyone", "G", "Teen", "13+", "PG", "10+", "M", "16+", "Rating Pending", null];
  const rows = ratings.map((age_rating) => ({ series_slug: "series", series: "Series", writer: "Writer", publisher: null, year: null, language_iso: "es", age_rating, library_section: "manga" }));
  const { library } = databaseModules({ rows });
  const options = await library.listCatalogLibraryFilterOptions();
  assert.deepEqual([...options.age.map((option) => option.value)], ["0+", "10+", "13+", "16+"]);
  for (const [age, expected] of [
    ["0+", ["0+", "Early Childhood", "Everyone", "G"]],
    ["10+", ["10+", "Everyone 10+", "PG"]],
    ["13+", ["13+", "Teen"]],
    ["16+", ["16+", "M"]],
  ]) {
    const params = [];
    catalogFilters.buildCatalogFilterSql({ age: [age] }, params);
    assert.deepEqual([...params[0]].sort(), expected.sort());
  }
});

test("genre and tag links open the matching library with oneshots included", () => {
  const { default: RelationsTable } = load("../src/components/catalog/CatalogRelationsTable.tsx", {
    typescript: ts,
    "react/jsx-runtime": jsxRuntime,
    "lucide-react": { CheckIcon: () => null },
    "@/components/ui/Pagination": { __esModule: true, default: () => null },
    "next/link": { __esModule: true, default: ({ href, children, ...props }) => createElement("a", { ...props, href: `${href.pathname}?${new URLSearchParams(href.query)}` }, children) },
  });
  for (const lang of ["es", "en"]) {
    const intl = JSON.parse(readFileSync(new URL(`../src/lib/i18n/dictionaries/${lang}/catalog.json`, import.meta.url), "utf8"));
    for (const filter of ["genre", "tag"]) {
      const name = "Acción & aventura";
      const html = renderToStaticMarkup(createElement(RelationsTable, {
        intl, lang, filter, nameLabel: filter,
        data: { items: [{ name, hasManga: true, hasComic: true, hasBooks: true, hasOthers: true, total: 4 }], total: 1, pageSize: 50 },
      }));
      const links = [...html.matchAll(/href="([^"]+)"/g)].map((match) => new URL(match[1].replaceAll("&amp;", "&"), "https://bunko.test"));
      assert.deepEqual(links.map((url) => url.pathname), ["manga", "comic", "books", "others"].map((section) => `/${lang}/${section}/series`));
      for (const url of links) {
        assert.equal(url.searchParams.get(filter), name);
        assert.equal(url.searchParams.get("includeOneshots"), "true");
      }
    }
  }
});

function literal(value) {
  if (Array.isArray(value)) return `ARRAY[${value.map(literal).join(",")}]::text[]`;
  if (value === null) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${value.replaceAll("'", "''")}'`;
}

function queryAssertion(call, expected, field = "id") {
  const sql = call.sql.replace(/\$(\d+)/g, (_match, index) => literal(call.params[Number(index) - 1]));
  return `DO $$ DECLARE actual text[]; BEGIN SELECT array_agg(${field}::text ORDER BY ${field}::text) INTO actual FROM (${sql}) result; ASSERT COALESCE(actual, ARRAY[]::text[]) = ${literal(expected)}, format('Expected %s, got %s', ${literal(expected)}, actual); END $$;`;
}

test("catalog and library publisher filters execute correctly in PostgreSQL", async () => {
  const { library, books, calls } = databaseModules();
  const assertions = [];
  for (const [filters, ids] of [
    [{ author: ["Second"] }, ["comic-1", "manga-1", "other-1", "book-1"]],
    [{ publisher: ["Publisher, Inc."] }, ["comic-1", "manga-1", "other-1", "book-1"]],
    [{ publisher: ["Publisher, Inc."], type: ["manga", "comic"] }, ["comic-1", "manga-1"]],
    [{ series: ["manga:manga"], author: ["Second"], year: ["2024"], publisher: ["Publisher, Inc."], age: ["Teen"], language: ["es"], type: ["manga"] }, ["manga-1"]],
    [{ author: ["__unknown__"], type: ["books"] }, ["book-2"]],
    [{ year: ["1900"] }, []],
    [{ age: ["13+"] }, ["manga-1", "book-1"]],
    [{ age: ["10+"] }, ["comic-1"]],
    [{ age: ["16+"] }, ["other-1"]],
    [{ age: ["0+"] }, ["manga-2", "other-2", "book-2"]],
    [{ age: ["6+"] }, ["comic-2"]],
    [{ age: ["10+", "16+"] }, ["comic-1", "other-1"]],
  ]) {
    calls.length = 0;
    await library.listPagedCatalogLibraryVolumes({ filters, pageSize: 50 });
    assertions.push(queryAssertion(calls.find((call) => call.kind === "rows"), ids.sort()));
    assertions.push(queryAssertion(calls.find((call) => call.kind === "count"), [String(ids.length)], "total"));
  }
  calls.length = 0;
  await library.listPagedCatalogLibraryVolumes({ filters: { publisher: ["Publisher, Inc."] }, page: 2, pageSize: 1 });
  assertions.push(queryAssertion(calls.find((call) => call.kind === "rows"), ["comic-1"]));
  assertions.push(queryAssertion(calls.find((call) => call.kind === "count"), ["4"], "total"));
  for (const scope of ["manga", "comic", "others"]) {
    calls.length = 0;
    await library.listPagedVolumes({ scope, publisherNames: ["Publisher, Inc."] });
    assertions.push(queryAssertion(calls.find((call) => call.kind === "rows"), [`${scope === "others" ? "other" : scope}-1`]));
    calls.length = 0;
    await library.listPagedSeriesWithVolumes({ scope, publisherNames: ["Publisher, Inc."] });
    assertions.push(queryAssertion(calls.find((call) => call.kind === "rows"), [scope === "others" ? "other" : scope]));
    calls.length = 0;
    await library.listLibraryFilters(scope);
    assertions.push(queryAssertion(calls.find((call) => call.sql.includes("BTRIM(vm.publisher) AS id")), ["Other", "Publisher, Inc."]));
  }
  calls.length = 0;
  await books.listBookVolumes({ publisherNames: ["Publisher, Inc."] });
  assertions.push(queryAssertion(calls[0], ["book-1"], "volume_id"));
  calls.length = 0;
  await books.listBookLibraryFilters();
  assertions.push(queryAssertion(calls.find((call) => call.sql.includes("BTRIM(bm.publisher) AS id")), ["Other", "Publisher, Inc."]));
  assertions.push(`
    DELETE FROM library_volumes WHERE id = 'comic-2';
    UPDATE library_series SET is_oneshot = TRUE WHERE id = 'manga';
    UPDATE book_series SET is_oneshot = TRUE WHERE id = 'book';
    INSERT INTO book_series (id, slug, title, sort_title, path, library_section)
      VALUES ('mirrored', 'mirrored', 'Mirrored', 'mirrored', '/other', 'other');
    INSERT INTO book_volumes (id, series_id, slug, title, sort_title, filename, full_path)
      VALUES ('mirror-1', 'mirrored', 'mirror-1', 'Mirrored', 'mirrored', 'other-1.epub', '/other-1.cbz');
    INSERT INTO book_metadata (id, volume_id, title, package_path)
      VALUES ('mirror-1', 'mirror-1', 'Mirrored', 'content.opf');
  `);
  calls.length = 0;
  await library.listPagedCatalogLibraryVolumes({ conversion: true, pageSize: 50 });
  assertions.push(queryAssertion(calls.find((call) => call.kind === "rows"), ["book-1", "book-2", "comic-1", "manga-1", "manga-2"]));
  assertions.push(queryAssertion(calls.find((call) => call.kind === "count"), ["5"], "total"));
  const directory = new URL("../src/lib/db/migrations/", import.meta.url);
  const migrations = readdirSync(directory).filter((file) => file.endsWith(".sql")).sort().map((file) => {
    const sql = readFileSync(new URL(file, directory), "utf8");
    return file === "005_unify_comic_library.sql" ? `ALTER TABLE library_series RENAME CONSTRAINT library_series_library_section_check TO manga_series_library_section_check;\n${sql}` : sql;
  });
  const fixture = readFileSync(new URL("libraryFilters.sql", import.meta.url), "utf8");
  const result = spawnSync("docker", ["run", "--rm", "--network", "none", "--user", "postgres", "-i", "postgres:16", "bash", "-ec", `
    initdb -D /tmp/bunko-test -A trust >/dev/null
    pg_ctl -D /tmp/bunko-test -o "-k /tmp -c listen_addresses=''" -w start >/dev/null
    trap 'pg_ctl -D /tmp/bunko-test -m immediate stop >/dev/null' EXIT
    psql -h /tmp -U postgres -v ON_ERROR_STOP=1 -q
  `], { input: [...migrations, fixture, ...assertions].join("\n"), encoding: "utf8", timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
});
