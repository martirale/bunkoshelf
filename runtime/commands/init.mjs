import { intro, outro, text, spinner, note, isCancel, cancel } from "@clack/prompts";
import chalk from "chalk";
import { randomBytes } from "node:crypto";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import { execa } from "execa";

const PACKAGE_NAME = "@itsmrtr/bunkoshelf";
const DEFAULT_PORT = 3060;
const packageRoot = fileURLToPath(new URL("../../package.json", import.meta.url));
const { version: packageVersion } = await fs.readJson(packageRoot);

function generateSecret() {
  return randomBytes(32).toString("hex");
}

function buildEnv(jwtSecret) {
  return [
    "DATABASE_URL=postgresql://user:password@localhost:5432/bunkoshelf",
    `JWT_SECRET=${jwtSecret}`,
    `PORT=${DEFAULT_PORT}`,
    `SITE_URL=http://localhost:${DEFAULT_PORT}`,
    "LIB_PROVIDER=local",
    "VAPID_PUBLIC_KEY=",
    "PUSH_SERVER_URL=",
    "PUSH_API_KEY=",
  ].join("\n") + "\n";
}

function buildPackageJson(name) {
  return {
    name,
    version: "0.1.0",
    private: true,
    scripts: {
      start: "bunkoshelf start",
      update: "bunkoshelf update",
    },
    dependencies: {
      [PACKAGE_NAME]: packageVersion,
    },
  };
}

export async function init(projectName) {
  intro(chalk.bold("▲ Bunko Shelf"));

  const useCurrentDir = projectName === ".";
  let name = useCurrentDir ? undefined : projectName;

  if (!name) {
    if (useCurrentDir) {
      name = process.cwd().split("/").pop() ?? "bunkoshelf";
    } else {
      const answer = await text({
        message: "Project name",
        placeholder: "my-bunkoshelf",
        defaultValue: "my-bunkoshelf",
        validate(value) {
          if (!value.trim()) return "Project name is required";
          if (!/^[a-z0-9-_]+$/.test(value)) {
            return "Use only lowercase letters, numbers, hyphens, and underscores";
          }
        },
      });

      if (isCancel(answer)) {
        cancel("Cancelled.");
        process.exit(0);
      }

      name = answer;
    }
  }

  const projectDir = useCurrentDir ? process.cwd() : resolve(process.cwd(), name);

  if (!useCurrentDir && (await fs.pathExists(projectDir))) {
    const entries = await fs.readdir(projectDir);
    if (entries.length > 0) {
      cancel(`Directory "${name}" already exists and is not empty.`);
      process.exit(1);
    }
  }

  const progress = spinner();

  progress.start("Creating project...");
  await fs.ensureDir(projectDir);
  await fs.writeFile(join(projectDir, ".env"), buildEnv(generateSecret()));
  await fs.writeJson(join(projectDir, "package.json"), buildPackageJson(name), {
    spaces: 2,
  });
  await fs.writeFile(join(projectDir, ".gitignore"), ".env\nnode_modules\n");
  progress.stop("Project created");

  progress.start("Installing dependencies...");
  await execa("npm", ["install"], { cwd: projectDir, stdio: "inherit" });
  progress.stop("Dependencies installed");

  note(
    [
      `Edit ${chalk.cyan(".env")} in your project and replace:`,
      "",
      `  ${chalk.yellow("DATABASE_URL")}=${chalk.dim("postgresql://user:password@localhost:5432/bunkoshelf")}`,
      "",
      "with your real PostgreSQL connection string.",
      "",
      "Then start Bunko Shelf:",
      "",
      `  ${chalk.cyan("npm start")}`,
      "",
      `Keep ${chalk.cyan("JWT_SECRET")} configured in production.`,
      "",
      "To update Bunko Shelf later:",
      "",
      `  ${chalk.cyan("npm run update")}`,
    ].join("\n"),
    "Next steps"
  );

  outro(`Your Bunko Shelf project is ready${useCurrentDir ? "" : ` at ${chalk.cyan(`./${name}`)}`}`);
}
