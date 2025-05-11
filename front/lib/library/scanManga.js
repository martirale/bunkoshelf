import fs from "fs/promises";
import path from "path";

const LIBRARY_PATH = path.resolve(process.cwd(), "../library/manga");
const SUPPORTED_EXTENSIONS = [".cbz"];

// Utilidad para generar slugs
function toSlug(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
          slug: toSlug(path.basename(f, path.extname(f))),
        }));

      if (volumes.length === 0) continue;

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

      // Identificar si es un oneshot por el sufijo '[oneshot]'
      const isOneshot = entry.name.endsWith("[oneshot]");

      entries.push({
        type: "series",
        title: entry.name.replace("[oneshot]", "").trim(), // Eliminar el sufijo '[oneshot]' para el frontend
        slug: toSlug(entry.name),
        path: entryPath,
        volumes,
        metadata,
        isOneshot, // Marca si es oneshot
      });
    } else if (
      SUPPORTED_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())
    ) {
      const volumeTitle = path.basename(entry.name, path.extname(entry.name));
      const volumePath = path.join(baseDir, entry.name);

      // Intentar cargar metadata asociada al archivo individual
      let metadata = null;
      const metaFilename = volumeTitle + ".bunko.json";
      try {
        const metaPath = path.join(baseDir, metaFilename);
        const stat = await fs.stat(metaPath);
        if (stat.isFile()) {
          const metaContent = await fs.readFile(metaPath, "utf-8");
          metadata = {
            path: metaPath,
            content: JSON.parse(metaContent),
          };
        }
      } catch (_) {
        // No hay metadata
      }

      entries.push({
        type: "volume",
        title: volumeTitle,
        slug: toSlug(volumeTitle),
        path: baseDir,
        filename: entry.name,
        fullPath: volumePath,
        metadata,
      });
    }
  }

  return entries;
}
