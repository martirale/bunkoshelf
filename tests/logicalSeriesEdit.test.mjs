import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { validateLogicalSeries } from "../src/lib/logicalSeries.ts";
import { buildNaturalSortKey } from "../src/lib/naturalSort.ts";

const source = readFileSync(new URL("../src/lib/db/logicalSeries.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const input = { title: " Updated series 10 ", section: "comic", members: [{ id: "second", position: 1 }, { id: "new", position: 2 }] };

function loadDatabase({ exists = true, available = 2, failInsert = false } = {}) {
  const calls = [];
  let released = false;
  let connections = 0;
  const client = {
    query: async (sql, params) => {
      calls.push({ sql, params });
      if (sql.includes("SELECT s.id")) return { rowCount: available };
      if (sql.includes("SELECT id FROM")) return { rowCount: exists ? 1 : 0 };
      if (failInsert && sql.includes("INSERT INTO")) throw new Error("Membership conflict");
      return { rowCount: 1 };
    },
    release: () => { released = true; },
  };
  const dependencies = {
    "@paralleldrive/cuid2": { createId: () => { throw new Error("Editing must preserve identity"); } },
    "@/lib/naturalSort": { buildNaturalSortKey },
    "@/lib/logicalSeries": { validateLogicalSeries },
    "./pool": { getPool: () => ({ connect: async () => { connections++; return client; } }) },
    "./query": {},
  };
  const exports = {};
  runInNewContext(compiled, { exports, require: (name) => {
    assert.ok(dependencies[name], `Unexpected import: ${name}`);
    return dependencies[name];
  } });
  return { ...exports, calls, isReleased: () => released, connectionCount: () => connections };
}

test("updates logical series in every library without replacing identity or status", async () => {
  for (const section of ["manga", "comic", "other", "books"]) {
    const database = loadDatabase();
    await database.updateLogicalSeriesRecord("logical", { ...input, section });
    const table = section === "books" ? "book_series" : "library_series";
    const membersTable = section === "books" ? "logical_book_series_members" : "logical_series_members";
    assert.equal(database.calls[0].sql, "BEGIN");
    assert.equal(database.calls.at(-1).sql, "COMMIT");
    assert.match(database.calls[1].sql, /is_logical = TRUE FOR UPDATE/);
    const insert = database.calls.find((call) => call.sql.includes("INSERT INTO"));
    assert.match(insert.sql, new RegExp(`INSERT INTO ${membersTable}`));
    assert.deepEqual(JSON.parse(insert.params[1]), input.members);
    assert.equal(insert.params[0], "logical");
    const update = database.calls.find((call) => call.sql.includes("UPDATE ") && !call.sql.includes("FOR UPDATE"));
    assert.match(update.sql, new RegExp(`UPDATE ${table} SET title`));
    assert.equal(update.params[0], "logical");
    assert.equal(update.params[1], "Updated series 10");
    assert.equal(update.params[2], buildNaturalSortKey("Updated series 10"));
    assert.doesNotMatch(update.sql, /slug|status|path|library_section/);
    assert.equal(database.isReleased(), true);
  }
});

test("validates members before removing existing memberships", async () => {
  const database = loadDatabase({ available: 1 });
  await assert.rejects(database.updateLogicalSeriesRecord("logical", input), /Unavailable series/);
  assert.equal(database.calls.at(-1).sql, "ROLLBACK");
  assert.equal(database.calls.some((call) => /DELETE|INSERT|UPDATE .*SET/.test(call.sql)), false);
  assert.equal(database.isReleased(), true);
});

test("does not edit missing, physical or differently classified series", async () => {
  const database = loadDatabase({ exists: false });
  await assert.rejects(database.updateLogicalSeriesRecord("physical", input), /Logical series not found/);
  assert.equal(database.calls.at(-1).sql, "ROLLBACK");
  assert.equal(database.calls[1].params[1], input.section);
  assert.equal(database.calls.some((call) => call.sql.includes("DELETE")), false);
});

test("rolls back if membership replacement fails", async () => {
  const database = loadDatabase({ failInsert: true });
  await assert.rejects(database.updateLogicalSeriesRecord("logical", input), /Membership conflict/);
  assert.equal(database.calls.some((call) => call.sql.includes("DELETE FROM logical_series_members")), true);
  assert.equal(database.calls.at(-1).sql, "ROLLBACK");
  assert.equal(database.calls.some((call) => call.sql === "COMMIT"), false);
  assert.equal(database.isReleased(), true);
});

test("rejects invalid edits before opening a database connection", async () => {
  const database = loadDatabase();
  await assert.rejects(database.updateLogicalSeriesRecord("logical", { ...input, members: [{ id: "only", position: 1 }] }), /Invalid logical series/);
  await assert.rejects(database.updateLogicalSeriesRecord("", input), /Invalid logical series/);
  assert.equal(database.connectionCount(), 0);
});

test("allows existing members of this grouping while rejecting other groupings", async () => {
  const database = loadDatabase();
  await database.updateLogicalSeriesRecord("logical", input);
  const selection = database.calls.find((call) => call.sql.includes("SELECT s.id"));
  assert.match(selection.sql, /m.logical_series_id <> \$3/);
  assert.equal(selection.params[2], "logical");
});
