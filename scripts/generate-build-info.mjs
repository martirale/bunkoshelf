import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let gitSha = process.env.GITHUB_SHA ?? null;
try {
  gitSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch {}
if (!gitSha || !/^[a-f\d]{40}$/i.test(gitSha)) gitSha = null;

await writeFile(join(root, "src/lib/buildInfo.json"), `${JSON.stringify({ gitSha, firstCommitYear: 2025, buildYear: new Date().getUTCFullYear() }, null, 2)}\n`);
console.log(`[bunko/build] Generated build information${gitSha ? ` for ${gitSha.slice(0, 7)}` : ""}.`);
