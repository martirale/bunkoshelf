import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

test("challenge and monthly counts include rereads and count duplicate dates once per work", async () => {
  const source = readFileSync(new URL("../src/lib/db/readingCompletions.ts", import.meta.url), "utf8");
  const script = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const requests = [];
  const exports = {};
  const dependencies = {
    react: { cache: (fn) => fn },
    "./query": { query: async (sql, params) => { requests.push({ sql, params }); } },
  };
  runInNewContext(script, { exports, require: (name) => dependencies[name] });

  const now = new Date(2026, 10, 19);
  await exports.getReadingCompletions("reader", now);
  await exports.getReadingCompletions("reader", now, "others");
  assert.deepEqual(Array.from(requests[0].params), ["reader", null, "2026-11"]);
  assert.deepEqual(Array.from(requests[1].params), ["reader", "other", "2026-11"]);

  const seed = `
    CREATE TABLE library_series (id text, library_section text);
    CREATE TABLE library_volumes (id text, series_id text);
    CREATE TABLE reading_entries (user_id text, volume_id text, read_at text);
    CREATE TABLE book_reading_entries (user_id text, volume_id text, read_at text);
    CREATE TABLE user_to_volumes (user_id text, volume_id text, first_read text);

    INSERT INTO library_series VALUES ('manga', 'manga'), ('other', 'other');
    INSERT INTO library_volumes VALUES ('reread', 'manga'), ('edited', 'manga'),
      ('legacy', 'other'), ('future', 'other'), ('unread', 'other');
    INSERT INTO reading_entries VALUES
      ('reader', 'reread', '2025-12-31'),
      ('reader', 'reread', '2026-01-01'),
      ('reader', 'edited', '2026-04-01'),
      ('reader', 'edited', '2026-04-01'),
      ('reader', 'future', '2026-12-01'),
      ('someone-else', 'unread', '2026-01-01');
    INSERT INTO user_to_volumes VALUES
      ('reader', 'edited', '2026-01-01'),
      ('reader', 'legacy', '2026-04-01'),
      ('reader', 'unread', NULL);
    INSERT INTO book_reading_entries VALUES
      ('reader', 'edited', '2026-05-03'),
      ('reader', 'edited', '2026-08-03'),
      ('reader', 'edited', '2026-08-03'),
      ('someone-else', 'book', '2026-01-01');
  `;
  const result = spawnSync("docker", [
    "run", "--rm", "--network", "none", "--user", "postgres", "-i", "postgres:16", "bash", "-ec", `
      initdb -D /tmp/bunko-test -A trust >/dev/null
      pg_ctl -D /tmp/bunko-test -o "-k /tmp -c listen_addresses=''" -w start >/dev/null
      trap 'pg_ctl -D /tmp/bunko-test -m immediate stop >/dev/null' EXIT
      psql -h /tmp -U postgres -v ON_ERROR_STOP=1 -qAt --csv
    `,
  ], {
    input: [seed, `PREPARE completions AS ${requests[0].sql};`,
      "EXECUTE completions('reader', NULL, '2026-11');",
      "EXECUTE completions('reader', 'other', '2026-11');",
    ].join("\n"),
    encoding: "utf8",
    timeout: 60000,
  });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  const rows = result.stdout.trim().split("\n").map((line) => {
    const [year, month, count] = line.split(",").map(Number);
    return { year, month, count };
  });
  assert.deepEqual(rows, [
    { year: 2025, month: 12, count: 1 },
    { year: 2026, month: 1, count: 1 },
    { year: 2026, month: 4, count: 2 },
    { year: 2026, month: 5, count: 1 },
    { year: 2026, month: 8, count: 1 },
    { year: 2026, month: 4, count: 1 },
  ]);
  assert.equal(exports.countReadingCompletions(rows.slice(0, -1), 2026), 5);
  assert.equal(exports.countReadingCompletions(rows.slice(0, -1), 2025), 1);
});
