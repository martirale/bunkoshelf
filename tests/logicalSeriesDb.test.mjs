import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

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
  const result = spawnSync("docker", [
    "run", "--rm", "--network", "none", "--user", "postgres", "-i", "postgres:16",
    "bash", "-ec", `
      initdb -D /tmp/bunko-test -A trust >/dev/null
      pg_ctl -D /tmp/bunko-test -o "-k /tmp -c listen_addresses=''" -w start >/dev/null
      trap 'pg_ctl -D /tmp/bunko-test -m immediate stop >/dev/null' EXIT
      psql -h /tmp -U postgres -v ON_ERROR_STOP=1 -q
    `,
  ], { input: [...migrations, assertions].join("\n"), encoding: "utf8", timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
});
