import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import AdmZip from "adm-zip";
import { readComicInfoArchive, writeComicInfoArchive } from "../src/lib/comicInfoArchive.ts";
import { parseComicInfoDocument } from "../src/lib/comicInfoDocument.ts";

const source = readFileSync(new URL("../src/actions/comic-info.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const xml = "<ComicInfo><Title>Original</Title><AltTitle>Alternate</AltTitle><Genre>Drama</Genre><Tags>One, Two</Tags></ComicInfo>";

function loadSave(options = {}) {
  const events = [];
  const writes = [];
  const synced = [];
  const logs = [];
  const zip = new AdmZip();
  zip.addFile("ComicInfo.xml", Buffer.from("<ComicInfo><Title>Before</Title></ComicInfo>"));
  zip.addFile("content.txt", Buffer.from("Unchanged"));
  const original = { data: zip.toBuffer(), revision: "original", etag: '"original"' };
  const client = {
    async query(sql) {
      events.push(sql.split(" ")[0]);
      if (options.busy && sql.startsWith("SELECT")) {
        assert.match(sql, /FOR UPDATE NOWAIT$/);
        throw Object.assign(new Error("Volume is locked"), { code: "55P03" });
      }
      return { rows: sql.startsWith("SELECT") ? [{ full_path: "/library/manga/volume.cbz" }] : [] };
    },
    release() { events.push("release"); },
  };
  const dependencies = {
    "next/cache": { updateTag() { events.push("invalidate"); } },
    "@/lib/auth/verifySession": { verifySession: async () => ({ isAdmin: true }) },
    "@/lib/db/ingestion": {
      async syncVolumeMetadataAndTaxonomy(input) {
        events.push("sync");
        if (options.databaseError) throw new Error("Database unavailable");
        synced.push(input);
      },
    },
    "@/lib/db/pool": { getPool: () => ({ connect: async () => client }) },
    "@/lib/comicInfoArchive": {
      async readComicInfoArchive(data) { events.push("inspect"); return readComicInfoArchive(data); },
      async writeComicInfoArchive(data, text) {
        events.push("prepare");
        return options.invalidOutput ? Buffer.from("Invalid archive") : writeComicInfoArchive(data, text);
      },
    },
    "@/lib/comicInfoDocument": { async parseComicInfoDocument(text) { events.push("parse"); return parseComicInfoDocument(text); } },
    "@/lib/comicInfoStorage": {
      async readStoredComicArchive() { events.push("read"); return original; },
      async writeStoredComicArchive(_path, _provider, previous, data) {
        events.push(data === original.data ? "restore" : "write");
        writes.push({ previous, data });
        return { data, revision: "saved", etag: '"saved"' };
      },
      async verifyStoredComicArchive() {
        events.push("verify");
        if (options.conflict) throw new Error("conflict");
      },
    },
    "@/lib/mangaLibraryCache": { MANGA_LIBRARY_TAG: "manga-library" },
  };
  const exports = {};
  runInNewContext(compiled, {
    exports, Buffer, Error, performance,
    process: { env: { LIB_PROVIDER: "cloud" }, memoryUsage: () => process.memoryUsage() },
    console: { info: (...args) => logs.push(args), error: (...args) => logs.push(args) },
    require(name) {
      assert.ok(dependencies[name], `Unexpected import: ${name}`);
      return dependencies[name];
    },
  });
  return { save: exports.saveComicInfo, events, writes, synced, original, logs };
}

test("validates the generated archive before writing and synchronizes it without downloading it again", async () => {
  const state = loadSave();
  const result = await state.save("volume", xml, "original");
  assert.equal(result.ok, true);
  assert.equal(state.events.filter((event) => event === "read").length, 1);
  assert.ok(state.events.indexOf("inspect") < state.events.indexOf("write"));
  assert.ok(state.events.indexOf("verify") < state.events.indexOf("sync"));
  assert.equal(state.writes.length, 1);
  assert.equal((await readComicInfoArchive(state.writes[0].data)).xml, xml);
  assert.equal(new AdmZip(state.writes[0].data).readAsText("content.txt"), "Unchanged");
  assert.equal(state.synced[0].metadata.altTitle, "Alternate");
  assert.deepEqual(state.synced[0].genres, ["Drama"]);
  assert.deepEqual(state.synced[0].tags, ["One", "Two"]);
  assert.ok(state.events.includes("COMMIT"));
  assert.ok(!state.events.includes("ROLLBACK"));
  assert.equal(state.logs[0][1].provider, "cloud");
  assert.equal(typeof state.logs[0][1].timings.prepareMs, "number");
});

test("a malformed generated archive never replaces the original file", async () => {
  const state = loadSave({ invalidOutput: true });
  const result = await state.save("volume", xml, "original");
  assert.equal(result.ok, false);
  assert.equal(result.error, "saveError");
  assert.equal(state.writes.length, 0);
  assert.equal(state.synced.length, 0);
  assert.ok(state.events.includes("ROLLBACK"));
  assert.equal(state.logs[0][1].stage, "prepareMs");
});

test("a stale revision stops before modifying or writing the archive", async () => {
  const state = loadSave();
  const result = await state.save("volume", xml, "stale");
  assert.equal(result.error, "conflict");
  assert.ok(!state.events.includes("prepare"));
  assert.equal(state.writes.length, 0);
});

test("a concurrent save fails before reading or modifying the archive", async () => {
  const state = loadSave({ busy: true });
  const result = await state.save("volume", xml, "original");
  assert.equal(result.error, "busy");
  assert.equal(state.logs[0][1].stage, "lockMs");
  assert.deepEqual(state.events, ["parse", "BEGIN", "SELECT", "ROLLBACK", "release"]);
});

for (const options of [{ conflict: true }, { databaseError: true }]) {
  test(`restores the previous archive when ${options.conflict ? "storage verification" : "database synchronization"} fails`, async () => {
    const state = loadSave(options);
    const result = await state.save("volume", xml, "original");
    assert.equal(result.ok, false);
    assert.equal(result.error, options.conflict ? "conflict" : "syncError");
    assert.equal(state.writes.length, 2);
    assert.equal(state.writes[1].data, state.original.data);
    assert.ok(state.events.indexOf("restore") < state.events.indexOf("ROLLBACK"));
    assert.ok(!state.events.includes("COMMIT"));
    assert.ok(!state.events.includes("invalidate"));
  });
}
