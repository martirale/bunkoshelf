import AdmZip from "adm-zip";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const validImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const TEMP_DIR_LIFETIME = 14 * 24 * 60 * 60 * 1000;

async function downloadFromR2(fullPath) {
  const key = fullPath.replace(/^\//, "");

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
  const response = await fetch(signedUrl);

  if (!response.ok) {
    throw new Error(`Failed to download from R2: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function getImagePathsFromDir(tempDir) {
  const files = await fs.readdir(tempDir);
  return files
    .filter((file) =>
      validImageExtensions.includes(path.extname(file).toLowerCase())
    )
    .map(
      (file) =>
        `/api/reader/temp-image?path=${encodeURIComponent(
          path.join(tempDir, file)
        )}`
    );
}

export async function extractImagesCbz(volume, slug, provider, activeVolumes) {
  let error = null;

  try {
    if (activeVolumes.has(slug)) {
      const tempDir = await activeVolumes.get(slug);

      try {
        await fs.access(tempDir);
        const imagePaths = await getImagePathsFromDir(tempDir);
        return { images: imagePaths };
      } catch (err) {
        activeVolumes.delete(slug);
      }
    }

    let zipBuffer;

    if (provider === "cloud") {
      zipBuffer = await downloadFromR2(volume.fullPath);
    } else {
      zipBuffer = await fs.readFile(volume.fullPath);
    }

    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    const entries = zipEntries
      .filter((entry) => {
        const ext = path.extname(entry.entryName).toLowerCase();
        return !entry.isDirectory && validImageExtensions.includes(ext);
      })
      .sort((a, b) => {
        const normalize = (name) =>
          name
            .split("/")
            .map((segment) =>
              segment.replace(/\d+/g, (num) => num.padStart(10, "0"))
            )
            .join("/");

        const nameA = normalize(a.entryName);
        const nameB = normalize(b.entryName);

        return nameA.localeCompare(nameB);
      });

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bunko-reader-"));
    activeVolumes.set(slug, tempDir);

    setTimeout(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        activeVolumes.delete(slug);
      } catch (err) {
        console.error("Failed to delete temp folder:", tempDir, err);
      }
    }, TEMP_DIR_LIFETIME);

    const imagePaths = [];
    let imageCounter = 1;

    for (const entry of entries) {
      const ext = path.extname(entry.entryName).toLowerCase();
      const newName = `${String(imageCounter).padStart(4, "0")}${ext}`;
      const imagePath = path.join(tempDir, newName);
      const fileData = entry.getData();

      await fs.writeFile(imagePath, fileData);
      imagePaths.push(
        `/api/reader/temp-image?path=${encodeURIComponent(imagePath)}`
      );
      imageCounter++;
    }

    return { images: imagePaths };
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("ZIP read error:", error);
      throw new Error("Failed to read archive");
    }
  }
}
