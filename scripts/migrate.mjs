import { config } from "dotenv";
import { resolve } from "node:path";
import { migrate } from "../runtime/db/migrate.mjs";

config({ path: resolve(process.cwd(), ".env") });

await migrate({
  migrationsDir: resolve(process.cwd(), "src/lib/db/migrations"),
});
