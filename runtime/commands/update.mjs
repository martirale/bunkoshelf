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

async function resolveGithubTarget(version) {
  if (version !== "latest") {
    return `github:${REPOSITORY_NAME}#${version}`;
  }

  try {
    const response = await fetch(REGISTRY_URL, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      return `github:${REPOSITORY_NAME}#main`;
    }

    const payload = await response.json();
    const latestVersion =
      payload && typeof payload.version === "string" ? payload.version : null;

    return latestVersion
      ? `github:${REPOSITORY_NAME}#${latestVersion}`
      : `github:${REPOSITORY_NAME}#main`;
  } catch {
    return `github:${REPOSITORY_NAME}#main`;
  }
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

  const progress = spinner();
  const target = `${PACKAGE_NAME}@${version}`;
  const packageManager = await detectPackageManager(process.cwd());
  const updateCommand = getUpdateDependencyCommand(packageManager, target);

  progress.start(`Updating ${PACKAGE_NAME} to ${chalk.cyan(version)}...`);

  try {
    await execa(updateCommand.command, updateCommand.args, {
      cwd: process.cwd(),
      stdio: "inherit",
    });
  } catch (error) {
    if (!isRegistryTarballNotFound(error)) {
      progress.stop(chalk.red("Update failed"));
      throw error;
    }

    const fallbackTarget = await resolveGithubTarget(version);

    progress.message(
      `Registry tarball unavailable, retrying from ${chalk.cyan(fallbackTarget)}...`
    );

    try {
      const fallbackCommand = getUpdateDependencyCommand(
        packageManager,
        fallbackTarget
      );

      await execa(fallbackCommand.command, fallbackCommand.args, {
        cwd: process.cwd(),
        stdio: "inherit",
      });
    } catch (fallbackError) {
      progress.stop(chalk.red("Update failed"));
      throw fallbackError;
    }
  }

  progress.stop(`Updated ${PACKAGE_NAME}`);
  outro(`Bunko Shelf is now installed from ${chalk.cyan(target)}`);
}
