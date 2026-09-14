import { intro, outro, spinner } from "@clack/prompts";
import chalk from "chalk";
import { execa } from "execa";
import fs from "fs-extra";
import { join } from "node:path";
import {
  detectPackageManager,
  getUpdateDependencyCommand,
} from "../package-manager.mjs";

const PACKAGE_NAME = "@itsmrtr/bunkoshelf";
const REPOSITORY_NAME = "martirale/bunkoshelf";
const REGISTRY_URL = `https://registry.npmjs.org/${encodeURIComponent(PACKAGE_NAME)}/latest`;

async function resolveLatestVersion() {
  try {
    const response = await fetch(REGISTRY_URL, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) return null;

    const payload = await response.json();
    return payload && typeof payload.version === "string" ? payload.version : null;
  } catch {
    return null;
  }
}

function resolveGithubTarget(version, latestVersion) {
  const targetVersion = version === "latest" ? latestVersion : version;
  return `github:${REPOSITORY_NAME}#${targetVersion ?? "main"}`;
}

function isRegistryTarballNotFound(error) {
  if (!error || typeof error !== "object") return false;
  if (!("stderr" in error) || typeof error.stderr !== "string") return false;

  return (
    error.stderr.includes("404 Not Found") &&
    error.stderr.includes("registry.npmjs.org") &&
    error.stderr.includes(PACKAGE_NAME)
  );
}

async function runPackageManagerCommand(command, args, cwd) {
  const subprocess = execa(command, args, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  subprocess.stdout?.pipe(process.stdout);
  subprocess.stderr?.pipe(process.stderr);

  return subprocess;
}

export async function update(version = "latest") {
  intro(chalk.bold("▲ Bunko Shelf"));

  const packageJsonPath = join(process.cwd(), "package.json");
  const hasPackageJson = await fs.pathExists(packageJsonPath);

  if (!hasPackageJson) {
    throw new Error("No package.json found in the current directory.");
  }

  const packageJson = await fs.readJson(packageJsonPath);
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  if (!dependencies[PACKAGE_NAME]) {
    throw new Error(`Current project does not depend on ${PACKAGE_NAME}.`);
  }

  const latestVersion = version === "latest" ? await resolveLatestVersion() : null;
  const targetVersion = latestVersion ?? version;
  const target = `${PACKAGE_NAME}@${targetVersion}`;
  const packageManager = await detectPackageManager(process.cwd());
  const updateCommand = getUpdateDependencyCommand(packageManager, target);
  const progress = spinner();
  let installedTarget = target;

  progress.start(`Updating ${PACKAGE_NAME} to ${chalk.cyan(targetVersion)}...`);

  try {
    await runPackageManagerCommand(
      updateCommand.command,
      updateCommand.args,
      process.cwd()
    );
  } catch (error) {
    if (!isRegistryTarballNotFound(error)) {
      progress.stop(chalk.red("Update failed"));
      throw error;
    }

    const fallbackTarget = resolveGithubTarget(version, latestVersion);

    progress.message(
      `Registry tarball unavailable, retrying from ${chalk.cyan(fallbackTarget)}...`
    );

    try {
      const fallbackCommand = getUpdateDependencyCommand(
        packageManager,
        fallbackTarget
      );

      await runPackageManagerCommand(
        fallbackCommand.command,
        fallbackCommand.args,
        process.cwd()
      );
      installedTarget = fallbackTarget;
    } catch (fallbackError) {
      progress.stop(chalk.red("Update failed"));
      throw fallbackError;
    }
  }

  progress.stop(`Updated ${PACKAGE_NAME}`);
  outro(`Bunko Shelf is now installed from ${chalk.cyan(installedTarget)}`);
}
