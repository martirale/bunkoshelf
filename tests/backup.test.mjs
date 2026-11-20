import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

test("restores legacy challenge goals and history without importing the old counter", async () => {
  const source = readFileSync(new URL("../src/lib/db/backup.ts", import.meta.url), "utf8");
  const script = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const queries = [];
  const client = {
    async query(sql, values) {
      queries.push({ sql, values });
      return { rows: [] };
    },
    release() {},
  };
  const exports = {};
  runInNewContext(script, {
    exports,
    require: () => ({ getPool: () => ({ query: client.query, connect: async () => client }) }),
  });
  const backup = await exports.exportDatabaseBackup();
  backup.tables.reading_challenges.push({ id: "challenge", goal: 100, completed: 58, notified: true });
  backup.tables.reading_entries.push({ id: "reading", read_at: "2026-09-12" });

  await exports.restoreDatabaseBackup(backup);

  assert.deepEqual(JSON.parse(JSON.stringify(queries.slice(-3))), [
    { sql: 'INSERT INTO "reading_challenges" ("id", "goal", "notified") VALUES ($1, $2, $3)', values: ["challenge", 100, true] },
    { sql: 'INSERT INTO "reading_entries" ("id", "read_at") VALUES ($1, $2)', values: ["reading", "2026-09-12"] },
    { sql: "COMMIT" },
  ]);
});
