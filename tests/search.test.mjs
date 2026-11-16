import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import MiniSearch from "minisearch";
import { getLibrarySection } from "../src/lib/librarySection.ts";
import { getComicTitle, getComicSeriesTitle } from "../src/lib/comicTitles.ts";
import { searchOfflineVolumes } from "../src/lib/client/offlineSearch.ts";

const source = readFileSync(new URL("../src/actions/search.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function loadSearch({ section = "manga", altTitle = "Ataque primer tomo", altSeries = "Ataque a los titanes", logical = false } = {}) {
  const series = {
    id: "series-id", title: logical ? "Reading order" : "Folder series", slug: "series-slug",
    isOneshot: false, isLogical: logical, librarySection: section,
  };
  const volume = {
    id: "volume-id", slug: "qvol01", seriesId: series.id, series,
    metadataObj: { title: "Kyojin volume one", series: "Shingeki no Kyojin", altTitle, altSeries, writer: "Hajime Isayama" },
    genres: [{ name: "Drama" }], tags: [{ name: "Giants" }],
  };
  const book = {
    id: "book-id", title: "Book of Proof", slug: "book-slug", writer: "Richard Hammack",
    seriesId: "book-series-id", seriesTitle: "Book saga", seriesSlug: "book-saga", seriesIsOneshot: false,
    librarySection: "books", subjects: "Mathematics",
  };
  const dependencies = {
    minisearch: { __esModule: true, default: MiniSearch },
    "@/lib/auth/verifySession": { verifySession: async () => ({ id: "user-id" }) },
    "@/lib/db/library": { listVolumes: async () => [volume], listSeriesWithVolumes: async () => [{ ...series, volumes: [volume] }] },
    "@/lib/db/books/library": { listBookSearchEntries: async () => [book] },
    "@/lib/librarySection": { getLibrarySection },
    "@/lib/comicTitles": { getComicTitle, getComicSeriesTitle },
  };
  const exports = {};
  runInNewContext(compiled, { exports, require(name) {
    assert.ok(dependencies[name], `Unexpected import: ${name}`);
    return dependencies[name];
  } });
  return exports.searchManga;
}

test("volumes can be found by original and alternate titles in every comic section", async () => {
  for (const section of ["manga", "comic", "other"]) {
    const search = loadSearch({ section });
    for (const query of ["Kyojin", "primer", "PRIMER"]) {
      const result = await search({ query });
      const volume = result.data.find((entry) => entry.id === "volume-volume-id");
      assert.ok(volume, `Volume missing for ${section}: ${query}`);
      assert.equal(volume.title, "Ataque primer tomo");
      assert.equal(volume.section, getLibrarySection(section));
      assert.equal(volume.slug, "qvol01");
    }
  }
});

test("series can be found by their folder, original and alternate names", async () => {
  const search = loadSearch();
  for (const query of ["Folder", "Shingeki", "titanes"]) {
    const result = await search({ query });
    const series = result.data.find((entry) => entry.type === "series");
    assert.equal(series?.series, "Ataque a los titanes");
    assert.equal(series?.slug, "series-slug");
  }
  const result = await search({ query: "Ataque" });
  assert.equal(new Set(result.data.map((entry) => entry.id)).size, result.data.length);
  assert.equal(result.data.filter((entry) => entry.type === "series").length, 1);
  assert.equal(result.data.filter((entry) => entry.type === "volume").length, 1);
});

test("missing and blank aliases retain the existing titles and searchable metadata", async () => {
  for (const alternate of [null, "", "   "]) {
    const search = loadSearch({ altTitle: alternate, altSeries: alternate });
    for (const query of ["Kyojin", "Isayama", "Drama", "Giants", "qvol01"]) {
      const result = await search({ query });
      const volume = result.data.find((entry) => entry.id === "volume-volume-id");
      assert.equal(volume?.title, "Kyojin volume one");
      assert.equal(volume?.series, "Shingeki no Kyojin");
    }
    const result = await search({ query: "primer" });
    assert.equal(result.data.length, 0);
  }
});

test("logical series retain their configured title when matched by a member alias", async () => {
  const search = loadSearch({ logical: true });
  const result = await search({ query: "titanes" });
  const series = result.data.find((entry) => entry.type === "series");
  assert.equal(series?.title, "Reading order");
  assert.equal(series?.series, "Reading order");
});

test("book search keeps its existing titles and author matching", async () => {
  const search = loadSearch();
  for (const query of ["Proof", "Hammack", "Mathematics"]) {
    const result = await search({ query });
    const book = result.data.find((entry) => entry.id === "book-volume-book-id");
    assert.equal(book?.title, "Book of Proof");
    assert.equal(book?.series, "Book saga");
    assert.equal(book?.section, "books");
  }
});

const offlineVolume = {
  id: "offline-id", slug: "offline-slug", section: "manga", title: "Cached title", seriesTitle: "Cached series",
  seriesSlug: "series-slug", isOneshot: true,
  metadata: { title: "Kyojin volume one", series: "Shingeki no Kyojin", altTitle: "Ataque primer tomo", altSeries: "Ataque a los titanes", writer: "Hajime Isayama" },
};

test("offline search matches both titles and both series names without duplicates", () => {
  for (const query of ["cached title", "cached series", "Kyojin", "PRIMER", "Shingeki", "titanes", "Isayama"]) {
    const result = searchOfflineVolumes([offlineVolume], query);
    assert.equal(result.length, 1, `Offline volume missing for: ${query}`);
    assert.equal(result[0].title, "Ataque primer tomo");
    assert.equal(result[0].slug, "offline-slug");
  }
});

test("offline search preserves the stored title for downloads without alternate metadata", () => {
  const volume = { ...offlineVolume, metadata: {} };
  assert.equal(searchOfflineVolumes([volume], "cached")[0].title, "Cached title");
  assert.equal(searchOfflineVolumes([volume], "primer").length, 0);
  assert.equal(searchOfflineVolumes([volume], "  ").length, 0);
});
