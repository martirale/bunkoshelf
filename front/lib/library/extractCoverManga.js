import fs from "fs";
import path from "path";
import yauzl from "yauzl";

export async function extractCoverImage(cbzPath, outputDir) {
  return new Promise((resolve, reject) => {
    yauzl.open(cbzPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        console.error(`Error opening ${cbzPath}:`, err);
        return reject(err);
      }

      const handleEntry = (entry) => {
        if (
          !entry.fileName.startsWith("__MACOSX") &&
          /\.(jpg|jpeg|png|webp)$/i.test(entry.fileName)
        ) {
          fs.mkdirSync(outputDir, { recursive: true });

          const ext = path.extname(entry.fileName).toLowerCase();
          const filename = `cover${ext}`;
          const outputPath = path.join(outputDir, filename);

          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              console.error(`Error reading entry ${entry.fileName}:`, err);
              return reject(err);
            }

            const writeStream = fs.createWriteStream(outputPath);

            readStream.pipe(writeStream);
            writeStream.on("finish", () => {
              // Cleanup
              zipfile.removeListener("entry", handleEntry);
              resolve(path.join("/covers", path.basename(outputDir), filename));
            });

            writeStream.on("error", (err) => {
              console.error(`Error writing cover image:`, err);
              reject(err);
            });
          });
        } else {
          zipfile.readEntry(); // Seguir leyendo si no es una imagen válida
        }
      };

      zipfile.on("entry", handleEntry);

      zipfile.on("error", (err) => {
        console.error(`Error extracting from ${cbzPath}:`, err);
        reject(err);
      });

      zipfile.on("end", () => {
        console.log("Finished processing the CBZ file.");
      });

      zipfile.readEntry(); // Comienza a leer
    });
  });
}
