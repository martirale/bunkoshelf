import fs from "fs/promises";
import path from "path";

const LIBRARY_PATH = path.resolve(process.cwd(), "../library/manga");

const SUPPORTED_EXTENSIONS = [".cbz"];

export async function scanMangaLibrary(baseDir = LIBRARY_PATH) {
  const entries = [];
  const dirContents = await fs.readdir(baseDir, { withFileTypes: true });

  for (const entry of dirContents) {
    const entryPath = path.join(baseDir, entry.name);

    if (entry.isDirectory()) {
      const subFiles = await fs.readdir(entryPath);
      const volumes = subFiles
        .filter((f) =>
          SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
        )
        .map((f) => ({
          filename: f,
          fullPath: path.join(entryPath, f),
        }));

      let metadata = null;
      const bunkoFile = subFiles.find((f) => f.endsWith(".bunko.json"));
      if (bunkoFile) {
        try {
          const metaContent = await fs.readFile(
            path.join(entryPath, bunkoFile),
            "utf-8"
          );
          metadata = {
            path: path.join(entryPath, bunkoFile),
            content: JSON.parse(metaContent),
          };
        } catch (err) {
          console.warn(`Error leyendo metadata para ${entry.name}:`, err);
        }
      }

      if (volumes.length > 0) {
        entries.push({
          title: entry.name,
          path: entryPath,
          volumes,
          metadata,
        });
      }
    } else if (
      SUPPORTED_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())
    ) {
      entries.push({
        title: path.basename(entry.name, path.extname(entry.name)),
        path: baseDir,
        volumes: [
          {
            filename: entry.name,
            fullPath: entryPath,
          },
        ],
        metadata: null,
      });
    }
  }

  return entries;
}
