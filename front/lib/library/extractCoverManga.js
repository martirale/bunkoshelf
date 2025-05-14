import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

export async function extractCoverImage(cbzPath, outputDir) {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip(cbzPath);
      const zipEntries = zip.getEntries();

      // Buscar la primera imagen en el ZIP
      for (const entry of zipEntries) {
        if (
          !entry.entryName.startsWith("__MACOSX") &&
          /\.(jpg|jpeg|png|webp)$/i.test(entry.entryName)
        ) {
          fs.mkdirSync(outputDir, { recursive: true });

          const ext = path.extname(entry.entryName).toLowerCase();
          const filename = `cover${ext}`;
          const outputPath = path.join(outputDir, filename);

          // Extraer la imagen
          const fileData = entry.getData();
          fs.writeFileSync(outputPath, fileData);

          resolve(path.join("/covers", path.basename(outputDir), filename));
          return; // Salir de la función una vez que la portada esté extraída
        }
      }

      // Si no se encuentra una imagen válida
      reject(new Error("No valid cover image found in the CBZ file."));
    } catch (err) {
      console.error(`Error extracting from ${cbzPath}:`, err);
      reject(err);
    }
  });
}
