import { access, cp, mkdir, readdir, readFile, rm, symlink } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";

const rootDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(rootDir, "..");
const distDir = join(projectRoot, "dist");

async function copyIfExists(source, target) {
  try {
    await access(source, constants.R_OK);
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target, { recursive: true, dereference: true });
  } catch {
    return;
  }
}

async function removeIfExists(target) {
  await rm(target, { recursive: true, force: true });
}

async function collectTraceFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await collectTraceFiles(fullPath, files);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".nft.json")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function collectServerFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await collectServerFiles(fullPath, files);
      continue;
    }

    if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".json"))) {
      files.push(fullPath);
    }
  }

  return files;
}

function resolveExternalAlias(filePath) {
  const match = filePath.match(/node_modules\/((?:@[^/]+\/)?[^/]+-[a-f0-9]{16,})$/);
  if (!match) return null;

  const aliasName = match[1];

  return {
    aliasName,
    packageName: aliasName.replace(/-[a-f0-9]{16,}$/, ""),
  };
}

async function ensureSymlink(linkPath, targetPath) {
  await mkdir(dirname(linkPath), { recursive: true });
  const linkTarget = relative(dirname(linkPath), targetPath) || ".";
  await removeIfExists(linkPath);
  await symlink(linkTarget, linkPath);
}

async function exposePnpmRootPackages() {
  const pnpmRoot = join(distDir, "node_modules", ".pnpm", "node_modules");
  const entries = await readdir(pnpmRoot, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(pnpmRoot, entry.name);
    const targetPath = join(distDir, "node_modules", entry.name);

    if (entry.name.startsWith("@")) {
      const scopedEntries = await readdir(sourcePath, { withFileTypes: true });
      for (const scopedEntry of scopedEntries) {
        await ensureSymlink(
          join(targetPath, scopedEntry.name),
          join(sourcePath, scopedEntry.name)
        );
      }
      continue;
    }

    await ensureSymlink(targetPath, sourcePath);
  }
}

async function createExternalAliases() {
  const serverFiles = await collectServerFiles(join(distDir, ".next", "server"));
  const aliases = new Map();

  for (const serverFile of serverFiles) {
    const content = await readFile(serverFile, "utf8");
    const matches = content.match(/node_modules\/((?:@[^/]+\/)?[^/]+-[a-f0-9]{16,})/g) ?? [];

    for (const match of matches) {
      const resolved = resolveExternalAlias(match);
      if (resolved) aliases.set(resolved.aliasName, resolved.packageName);
    }
  }

  for (const [aliasName, packageName] of aliases) {
    const aliasPath = join(distDir, "node_modules", aliasName);
    const targetPath = join(distDir, "node_modules", packageName);

    try {
      await access(targetPath, constants.R_OK);
    } catch {
      continue;
    }

    await ensureSymlink(aliasPath, targetPath);
  }
}

await rm(distDir, { recursive: true, force: true });

await execa("pnpm", ["build"], {
  cwd: projectRoot,
  stdio: "inherit",
});

await cp(join(projectRoot, ".next", "standalone"), distDir, {
  recursive: true,
  dereference: true,
});
await copyIfExists(
  join(projectRoot, ".next", "static"),
  join(distDir, ".next", "static")
);
await copyIfExists(join(projectRoot, "public"), join(distDir, "public"));
await copyIfExists(
  join(projectRoot, "src", "lib", "db", "migrations"),
  join(distDir, "migrations")
);

await Promise.all([
  removeIfExists(join(distDir, ".env")),
  removeIfExists(join(distDir, "logs")),
  removeIfExists(join(distDir, "tmp")),
  removeIfExists(join(distDir, "public", ".DS_Store")),
]);

await exposePnpmRootPackages();
await createExternalAliases();
