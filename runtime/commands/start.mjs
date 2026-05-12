import { config } from "dotenv";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ensureDefaultAdmin } from "../db/bootstrap.mjs";
import { migrate } from "../db/migrate.mjs";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export async function start() {
  config({ path: resolve(process.cwd(), ".env") });

  const serverPath = join(packageRoot, "..", "dist", "server.js");
  await access(serverPath, constants.R_OK);

  await migrate({
    migrationsDir: join(packageRoot, "..", "dist", "migrations"),
  });

  await ensureDefaultAdmin();

  await import(pathToFileURL(serverPath).href);
}
