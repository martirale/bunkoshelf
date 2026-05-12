import { config } from "dotenv";
import { execa } from "execa";
import { resolve } from "node:path";
import { ensureDefaultAdmin } from "../runtime/db/bootstrap.mjs";
import { migrate } from "../runtime/db/migrate.mjs";

config({ path: resolve(process.cwd(), ".env") });

await migrate({
  migrationsDir: resolve(process.cwd(), "src/lib/db/migrations"),
});

await ensureDefaultAdmin();

await execa("pnpm", ["exec", "next", "dev"], {
  cwd: process.cwd(),
  stdio: "inherit",
});
