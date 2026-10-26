import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { getAdjacentSlugs } from "../src/lib/adjacentNavigation.ts";
import { getLibrarySection } from "../src/lib/librarySection.ts";

const source = readFileSync(new URL("../src/lib/db/volumeNavigation.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const logical = { id: "logical", slug: "logical", title: "The Legend of Korra", librarySection: "comic", isLogical: true, isOneshot: false };
const physical = { id: "turf-wars", slug: "turf-wars", title: "Turf Wars", librarySection: "comic", isOneshot: false };
const volumes = ["turf-1", "turf-2", "turf-3", "ruins-1", "ruins-2", "ruins-3"].map((slug) => ({ slug }));

function loadNavigation({ parent = logical, items = volumes } = {}) {
  const calls = [];
  const dependencies = {
    "@/lib/adjacentNavigation": { getAdjacentSlugs },
    "@/lib/librarySection": { getLibrarySection },
    "./query": { queryOne: async (sql, params) => { calls.push({ kind: "query", sql, params }); return parent; } },
    "./library": { listVolumes: async (options) => { calls.push({ kind: "library", options }); return items; } },
    "./books/library": { listBookVolumes: async (options) => { calls.push({ kind: "books", options }); return items; } },
  };
  const exports = {};
  runInNewContext(compiled, { exports, require: (name) => {
    assert.ok(dependencies[name], `Unexpected import: ${name}`);
    return dependencies[name];
  } });
  return { ...exports, calls };
}

test("archive navigation crosses physical series boundaries in logical order", async () => {
  for (const librarySection of ["manga", "comic", "other"]) {
    const parent = { ...logical, librarySection };
    const navigation = loadNavigation({ parent });
    const volume = { slug: "turf-3", seriesId: physical.id, series: { ...physical, librarySection } };
    const result = await navigation.getLibraryVolumeNavigation(volume);
    assert.equal(result.series, parent);
    assert.equal(result.previousSlug, "turf-2");
    assert.equal(result.nextSlug, "ruins-1");
    assert.equal(volume.series.id, physical.id);
    assert.equal(navigation.calls[1].options.seriesIds[0], parent.id);
    assert.equal(navigation.calls[1].options.scope, getLibrarySection(librarySection));
  }
});

test("reverse navigation returns to the preceding physical series", async () => {
  const navigation = loadNavigation();
  const result = await navigation.getLibraryVolumeNavigation({ slug: "ruins-1", seriesId: "ruins", series: physical });
  assert.equal(result.previousSlug, "turf-3");
  assert.equal(result.nextSlug, "ruins-2");
});

test("logical first and last volumes do not wrap around", async () => {
  const navigation = loadNavigation();
  const first = await navigation.getLibraryVolumeNavigation({ slug: "turf-1", seriesId: physical.id, series: physical });
  const last = await navigation.getLibraryVolumeNavigation({ slug: "ruins-3", seriesId: physical.id, series: physical });
  assert.equal(first.previousSlug, undefined);
  assert.equal(last.nextSlug, undefined);
});

test("ungrouped and ungrouped-again series retain physical navigation", async () => {
  const navigation = loadNavigation({ parent: null, items: volumes.slice(0, 3) });
  const result = await navigation.getLibraryVolumeNavigation({ slug: "turf-3", seriesId: physical.id, series: physical });
  assert.equal(result.series, physical);
  assert.equal(result.nextSlug, undefined);
  assert.equal(navigation.calls[1].options.seriesIds[0], physical.id);
});

test("oneshots keep their existing navigation without loading a series", async () => {
  const navigation = loadNavigation({ parent: null });
  const series = { ...physical, isOneshot: true };
  const result = await navigation.getLibraryVolumeNavigation({ slug: "oneshot", seriesId: series.id, series });
  assert.equal(result.series, series);
  assert.equal(result.previousSlug, undefined);
  assert.equal(result.nextSlug, undefined);
  assert.equal(navigation.calls.length, 1);
});

test("book navigation uses the logical book series", async () => {
  const parent = { ...logical, librarySection: "books" };
  const navigation = loadNavigation({ parent });
  const result = await navigation.getBookVolumeNavigation({ slug: "turf-3", series: { ...physical, librarySection: "books" } });
  assert.equal(result.series, parent);
  assert.equal(result.nextSlug, "ruins-1");
  assert.equal(navigation.calls[1].kind, "books");
  assert.equal(navigation.calls[1].options.seriesSlug, parent.slug);
});

test("EPUBs in Others use their logical library series across formats", async () => {
  const parent = { ...logical, librarySection: "other" };
  const navigation = loadNavigation({ parent });
  const result = await navigation.getBookVolumeNavigation({ slug: "turf-3", series: { ...physical, librarySection: "other" } });
  assert.equal(result.series, parent);
  assert.equal(result.nextSlug, "ruins-1");
  assert.match(navigation.calls[0].sql, /FROM library_volumes/);
  assert.equal(navigation.calls[0].params[0], "turf-3");
  assert.equal(navigation.calls[1].kind, "library");
  assert.equal(navigation.calls[1].options.scope, "others");
});

test("ungrouped EPUBs retain their book series and ordering", async () => {
  for (const librarySection of ["books", "other"]) {
    const navigation = loadNavigation({ parent: null });
    const series = { ...physical, librarySection };
    const result = await navigation.getBookVolumeNavigation({ slug: "turf-3", series });
    assert.equal(result.series, series);
    assert.equal(navigation.calls[1].kind, "books");
    assert.equal(navigation.calls[1].options.seriesSlug, physical.slug);
    assert.equal(navigation.calls[1].options.librarySection, librarySection);
  }
});
