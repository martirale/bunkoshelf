import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const dependencies = [];
const notices = [`${pkg.name}\nDirect runtime dependencies\n\nThese notices apply to the listed dependencies. Bunko Shelf's own license is provided separately.`];

for (const name of Object.keys(pkg.dependencies).sort()) {
  const directory = join(root, "node_modules", name);
  const metadata = JSON.parse(await readFile(join(directory, "package.json"), "utf8"));
  const license = typeof metadata.license === "string" ? metadata.license : metadata.license?.type ?? null;
  dependencies.push({ name, version: metadata.version, license });
  const files = (await readdir(directory)).filter((file) => /^(licen[cs]e|copying|notice)([.-].*)?$/i.test(file)).sort();
  const texts = await Promise.all(files.map(async (file) => `${file}\n\n${await readFile(join(directory, file), "utf8")}`));
  notices.push(`${name}@${metadata.version}\nLicense: ${license ?? "See package documentation"}\nhttps://www.npmjs.com/package/${name}/v/${metadata.version}\n\n${texts.join("\n\n") || "See the package documentation for its license terms."}`);
}

await writeFile(join(root, "src/lib/thirdPartySoftware.json"), `${JSON.stringify({ dependencies }, null, 2)}\n`);
await writeFile(join(root, "public/third-party-notices.txt"), `${notices.join("\n\n--------------------------------------------------------------------------------\n\n")}\n`);
console.log(`[bunko/notices] Generated notices for ${dependencies.length} direct runtime dependencies.`);
