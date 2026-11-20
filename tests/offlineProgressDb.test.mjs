import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

test("PostgreSQL keeps one automatic completion per day and rejects older positions", async () => {
  const source = readFileSync(new URL("../src/lib/db/reading.ts", import.meta.url), "utf8");
  const script = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const statements = [];
  const client = {
    query: async (sql) => statements.push(`${sql};`),
    release() {},
  };
  let nextId = 0;
  let attempts = 0;
  const dependencies = {
    "@paralleldrive/cuid2": { createId: () => `id-${++nextId}` },
    "./pool": { getPool: () => ({ connect: async () => client }) },
    "./query": {
      execute: async (sql, params) => {
        const values = params.map((value) => {
          if (value instanceof Date) return `'${value.toISOString()}'`;
          if (typeof value === "boolean" || typeof value === "number") return String(value);
          return `'${value.replaceAll("'", "''")}'`;
        });
        statements.push(`PREPARE verify_statement AS ${sql};
          EXECUTE verify_statement(${values.join(",")}); DEALLOCATE verify_statement;`);
        return sql.includes("INSERT INTO reading_entries") ? Number(attempts++ === 0) : 1;
      },
    },
  };
  const exports = {};
  runInNewContext(script, { exports, require: (name) => dependencies[name] });
  const save = (lastPage, time) => exports.saveVolumeReadingPosition("reader", "volume", {
    lastPage, totalPages: 20, lastReadAt: new Date(`2026-01-03T00:00:${time}.000Z`), date: "2026-01-02",
  });
  const entryCheck = (expected) => `DO $$ BEGIN
    ASSERT (SELECT COUNT(*) FROM reading_entries) = ${expected};
  END $$;`;
  await save(19, "02");
  statements.push(entryCheck(1));
  await save(19, "03");
  statements.push(entryCheck(1));
  await save(8, "04");
  await save(4, "01");
  statements.push(`DO $$ BEGIN
    ASSERT (SELECT last_page FROM user_to_volumes) = 8;
    ASSERT (SELECT personal_rating FROM user_to_volumes) = 8.5;
    ASSERT (SELECT first_read FROM user_to_volumes) = '2026-01-02';
    ASSERT (SELECT COUNT(*) FROM daily_reading_logs) = 1;
    ASSERT (SELECT goal = 100 AND notified FROM reading_challenges WHERE id = 'challenge');
    ASSERT NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'reading_challenges' AND column_name = 'completed'
    );
  END $$;`);
  const migrations = readFileSync(new URL("../src/lib/db/migrations/001_initial_schema.sql", import.meta.url), "utf8");
  const removeCounter = readFileSync(new URL("../src/lib/db/migrations/023_remove_challenge_counter.sql", import.meta.url), "utf8");
  const seed = `
    INSERT INTO users (id, username, password) VALUES ('reader', 'reader', 'unused');
    INSERT INTO reading_challenges (id, user_id, year, goal, completed, notified)
    VALUES ('challenge', 'reader', 2026, 100, 58, TRUE);
    INSERT INTO library_series (id, slug, title, path) VALUES ('series', 'series', 'Series', '/series');
    INSERT INTO library_volumes (id, slug, title, filename, full_path, series_id)
    VALUES ('volume', 'volume', 'Volume', 'volume.cbz', '/series/volume.cbz', 'series');
    INSERT INTO user_to_volumes (id, user_id, volume_id, personal_rating)
    VALUES ('progress', 'reader', 'volume', 8.5);
  `;
  const result = spawnSync("docker", [
    "run", "--rm", "--network", "none", "--user", "postgres", "-i", "postgres:16", "bash", "-ec", `
      initdb -D /tmp/bunko-test -A trust >/dev/null
      pg_ctl -D /tmp/bunko-test -o "-k /tmp -c listen_addresses=''" -w start >/dev/null
      trap 'pg_ctl -D /tmp/bunko-test -m immediate stop >/dev/null' EXIT
      psql -h /tmp -U postgres -v ON_ERROR_STOP=1 -q
    `,
  ], { input: [migrations, seed, removeCounter, ...statements].join("\n"), encoding: "utf8", timeout: 60000 });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
});
