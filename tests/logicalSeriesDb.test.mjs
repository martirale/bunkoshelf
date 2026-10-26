import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

async function captureSeriesCountQueries() {
  const calls = [];
  const database = {
    query: async () => [],
    queryOne: async (sql) => { calls.push(sql); return { count: "0" }; },
  };
  async function load(path, dependencies) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const exports = {};
    runInNewContext(compiled, { exports, require: (name) => dependencies[name] ?? {} });
    return exports;
  }
  const stats = await load("../src/actions/stats.ts", {
    "@/lib/auth/verifySession": { verifySession: async () => ({ id: "reader" }) },
    "@/lib/db/query": database,
  });
  const counts = {};
  for (const scope of ["manga", "comic", "others", "all"]) {
    calls.length = 0;
    await stats.getReaderStats({ scope });
    counts[scope] = calls.find((sql) => sql.includes("COUNT(DISTINCT ms.id)"));
    assert.ok(counts[scope], `Missing count query for ${scope}`);
    if (scope === "all") counts.generalBooks = calls.find((sql) => sql.includes("FROM book_series"));
  }
  const books = await load("../src/lib/db/books/library.ts", { "../query": database });
  calls.length = 0;
  await books.getBookReaderStats("reader");
  counts.books = calls.find((sql) => sql.includes("FROM book_series bs"));
  assert.ok(counts.books);
  assert.ok(counts.generalBooks);
  return counts;
}

test("logical series migrations, editing, ordering, progress and removal in PostgreSQL", async () => {
  const directory = new URL("../src/lib/db/migrations/", import.meta.url);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  const migrations = await Promise.all(files.map(async (file) => {
    const sql = await readFile(new URL(file, directory), "utf8");
    if (file !== "005_unify_comic_library.sql") return sql;
    // Reproduce the legacy constraint name expected by migration 005.
    return `ALTER TABLE library_series RENAME CONSTRAINT library_series_library_section_check TO manga_series_library_section_check;\n${sql}`;
  }));
  const edits = await readFile(new URL("logicalSeriesEdit.sql", import.meta.url), "utf8");
  const assertions = (await readFile(new URL("logicalSeries.sql", import.meta.url), "utf8"))
    .replace("DELETE FROM library_series WHERE is_logical;", () => `${edits}\nDELETE FROM library_series WHERE is_logical;`);
  const queries = await captureSeriesCountQueries();
  const counts = (await readFile(new URL("logicalSeriesCounts.sql", import.meta.url), "utf8"))
    .replace(/\{\{(\w+)\}\}/g, (_match, name) => queries[name]);
  const result = spawnSync("docker", [
    "run", "--rm", "--network", "none", "--user", "postgres", "-i", "postgres:16",
    "bash", "-ec", `
      initdb -D /tmp/bunko-test -A trust >/dev/null
      pg_ctl -D /tmp/bunko-test -o "-k /tmp -c listen_addresses=''" -w start >/dev/null
      trap 'pg_ctl -D /tmp/bunko-test -m immediate stop >/dev/null' EXIT
      psql -h /tmp -U postgres -v ON_ERROR_STOP=1 -q
    `,
  ], { input: [...migrations, assertions, counts].join("\n"), encoding: "utf8", timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
});
