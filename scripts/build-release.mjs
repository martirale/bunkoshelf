import { access, cp, mkdir, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";

const rootDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(rootDir, "..");
const distDir = join(projectRoot, "dist");

async function copyIfExists(source, target) {
  try {
    await access(source, constants.R_OK);
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target, { recursive: true });
  } catch {
    return;
  }
}

await execa("pnpm", ["build"], {
  cwd: projectRoot,
  stdio: "inherit",
});

await rm(distDir, { recursive: true, force: true });
await cp(join(projectRoot, ".next", "standalone"), distDir, { recursive: true });
await copyIfExists(
  join(projectRoot, ".next", "static"),
  join(distDir, ".next", "static")
);
await copyIfExists(join(projectRoot, "public"), join(distDir, "public"));
await copyIfExists(
  join(projectRoot, "src", "lib", "db", "migrations"),
  join(distDir, "migrations")
);
