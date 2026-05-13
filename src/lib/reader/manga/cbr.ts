import { createExtractorFromData } from "node-unrar-js";
import fsp from "fs/promises";
import os from "os";
import path from "path";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { LibraryVolume } from "@/lib/db/library";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import { loadUnrarWasmBinary } from "@/lib/unrar";
import type { StorageProvider } from "@/lib/types";

const validImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const TEMP_DIR_LIFETIME = 14 * 24 * 60 * 60 * 1000;

const wasmBinary = await loadUnrarWasmBinary();

async function downloadFromR2(fullPath: string): Promise<Buffer> {
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

async function getImagePathsFromDir(tempDir: string): Promise<string[]> {
  const files = await fsp.readdir(tempDir);
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

export async function extractImagesCbr(
  volume: LibraryVolume,
  slug: string,
  provider: StorageProvider,
  activeVolumes: Map<string, string>
): Promise<{ images: string[] }> {
  let error: Error | null = null;

  try {
    if (activeVolumes.has(slug)) {
      const tempDir = activeVolumes.get(slug)!;

      try {
        await fsp.access(tempDir);
        const imagePaths = await getImagePathsFromDir(tempDir);
        return { images: imagePaths };
      } catch {
        activeVolumes.delete(slug);
      }
    }

    let rarBuffer: Buffer;

    if (provider === "cloud") {
      rarBuffer = await downloadFromR2(volume.fullPath);
    } else {
      rarBuffer = await fsp.readFile(volume.fullPath);
    }

    const extractor = await createExtractorFromData({
      data: new Uint8Array(rarBuffer).buffer as ArrayBuffer,
      wasmBinary: new Uint8Array(wasmBinary).buffer as ArrayBuffer,
    });

    const list = extractor.getFileList();
    const fileHeaders = [...list.fileHeaders];

    const entries = fileHeaders
      .filter((header) => {
        const ext = path.extname(header.name).toLowerCase();
        return validImageExtensions.includes(ext);
      })
      .sort((a, b) => {
        const normalize = (name: string) =>
          name
            .split("/")
            .map((segment) =>
              segment.replace(/\d+/g, (num) => num.padStart(10, "0"))
            )
            .join("/");

        const nameA = normalize(a.name);
        const nameB = normalize(b.name);

        return nameA.localeCompare(nameB);
      });

    const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "bunko-reader-"));
    activeVolumes.set(slug, tempDir);

    setTimeout(async () => {
      try {
        await fsp.rm(tempDir, { recursive: true, force: true });
        activeVolumes.delete(slug);
      } catch (err) {
        console.error("Failed to delete temp folder:", tempDir, err);
      }
    }, TEMP_DIR_LIFETIME);

    const imagePaths: string[] = [];
    let imageCounter = 1;

    for (const entry of entries) {
      const ext = path.extname(entry.name).toLowerCase();
      const newName = `${String(imageCounter).padStart(4, "0")}${ext}`;
      const imagePath = path.join(tempDir, newName);

      const extracted = extractor.extract({ files: [entry.name] });
      const files = [...extracted.files];

      if (files.length > 0) {
        const fileData = files[0].extraction!;
        await fsp.writeFile(imagePath, fileData);
        imagePaths.push(
          `/api/reader/temp-image?path=${encodeURIComponent(imagePath)}`
        );
        imageCounter++;
      }
    }

    return { images: imagePaths };
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("RAR read error:", error);
      throw new Error("Failed to read archive");
    }
  }

  throw new Error("Failed to read archive");
}
