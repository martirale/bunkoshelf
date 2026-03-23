import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";

export const dynamic = "force-dynamic";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { log } from "@/lib/logger";
import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import { indexUploadedVolume } from "@/lib/uploadIndexer";

export const maxDuration = 300;

const LIBRARY_PATH = path.resolve(process.cwd(), "../library");
const TEMP_PATH = path.resolve(process.cwd(), "../temp");
const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";

function generateChecksum() {
  return crypto.randomBytes(8).toString("hex");
}

export async function POST(request) {
  let _err;
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await fs.mkdir(TEMP_PATH, { recursive: true });

    const formData = await request.formData();
    const metadataStr = formData.get("metadata");
    const chunk = formData.get("chunk");
    const fileName = formData.get("fileName");
    const chunkIndex = parseInt(formData.get("chunkIndex"));
    const totalChunks = parseInt(formData.get("totalChunks"));
    const fileIndex = parseInt(formData.get("fileIndex"));
    const totalFiles = parseInt(formData.get("totalFiles"));

    if (!chunk || !fileName) {
      throw new Error("Missing chunk or fileName");
    }

    const metadata = JSON.parse(metadataStr);
    const { type, isNew, newDirectoryName, isOneshot, existingDirectory } =
      metadata;

    const tempFilePath = path.join(TEMP_PATH, `${fileName}.part`);

    const arrayBuffer = await chunk.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (chunkIndex === 0) {
      await fs.writeFile(tempFilePath, uint8Array);

      const cover = formData.get("cover");
      const coverFilename = formData.get("coverFilename");
      const volumeMetadata = formData.get("volumeMetadata");

      if (cover && coverFilename) {
        const coverBuffer = await cover.arrayBuffer();
        await fs.writeFile(
          path.join(TEMP_PATH, `${fileName}.cover.part`),
          new Uint8Array(coverBuffer)
        );
        await fs.writeFile(
          path.join(TEMP_PATH, `${fileName}.cover.name`),
          coverFilename,
          "utf8"
        );
      }

      if (volumeMetadata) {
        await fs.writeFile(
          path.join(TEMP_PATH, `${fileName}.meta.json`),
          volumeMetadata,
          "utf8"
        );
      }
    } else {
      await fs.appendFile(tempFilePath, uint8Array);
    }

    if (chunkIndex === totalChunks - 1) {
      const libraryType = type === "manga" ? "manga" : "books";
      const fileBuffer = await fs.readFile(tempFilePath);
      const checksum = generateChecksum();
      const txtFileName = `${path.parse(fileName).name}.txt`;

      let coverData = null;
      let coverFilename = null;
      const coverPartPath = path.join(TEMP_PATH, `${fileName}.cover.part`);
      const coverNamePath = path.join(TEMP_PATH, `${fileName}.cover.name`);

      try {
        await fs.access(coverPartPath);
        coverData = await fs.readFile(coverPartPath);
        coverFilename = await fs.readFile(coverNamePath, "utf8");
      } catch {
        // no cover
      }

      let volumeMeta = null;
      const metaJsonPath = path.join(TEMP_PATH, `${fileName}.meta.json`);
      try {
        const metaStr = await fs.readFile(metaJsonPath, "utf8");
        volumeMeta = JSON.parse(metaStr);
      } catch {
        // no metadata
      }

      const suffix = isOneshot ? " [oneshot]" : "";
      const directoryName = isNew ? newDirectoryName : existingDirectory;
      const dirWithSuffix = `${directoryName}${isNew ? suffix : ""}`;

      if (LIB_PROVIDER === "cloud") {
        const r2Key = `library/${libraryType}/${dirWithSuffix}/${fileName}`;
        const txtKey = `library/${libraryType}/${dirWithSuffix}/${txtFileName}`;

        await r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: r2Key,
            Body: fileBuffer,
          })
        );

        await r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: txtKey,
            Body: checksum,
            ContentType: "text/plain",
          })
        );

        if (coverData && coverFilename) {
          const coverKey = `library/${libraryType}/${dirWithSuffix}/${coverFilename}`;
          await r2Client.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: coverKey,
              Body: coverData,
            })
          );
        }

        if (libraryType === "manga") {
          const seriesPath = `/library/${libraryType}/${dirWithSuffix}`;
          await indexUploadedVolume({
            fileName,
            fullPath: `/${r2Key}`,
            dirName: dirWithSuffix,
            seriesPath,
            isOneshot,
            coverFilename: coverFilename || null,
            metadata: volumeMeta?.metadata || null,
            genres: volumeMeta?.genres || [],
            tags: volumeMeta?.tags || [],
            fileSize: fileBuffer.length,
          });
        }

        await fs.unlink(tempFilePath);

        if (fileIndex === totalFiles - 1) {
          log({
            event: "Files uploaded to library",
            category: "LIBRARY",
            meta: {
              userId: user.id,
              username: user.username,
              isAdmin: user.isAdmin,
              type: libraryType,
              directory: directoryName,
              filesCount: totalFiles,
              provider: "cloud",
            },
          });
        }
      } else {
        const basePath = path.join(LIBRARY_PATH, libraryType);
        let targetDirectory;

        if (isNew) {
          targetDirectory = path.join(basePath, dirWithSuffix);
          if (fileIndex === 0) {
            await fs.mkdir(targetDirectory, { recursive: true });
          }
        } else {
          targetDirectory = path.join(basePath, existingDirectory);
        }

        const finalPath = path.join(targetDirectory, fileName);
        const txtPath = path.join(targetDirectory, txtFileName);

        await fs.copyFile(tempFilePath, finalPath);
        await fs.writeFile(txtPath, checksum, "utf8");

        if (coverData && coverFilename) {
          await fs.writeFile(
            path.join(targetDirectory, coverFilename),
            coverData
          );
        }

        if (libraryType === "manga") {
          await indexUploadedVolume({
            fileName,
            fullPath: finalPath,
            dirName: path.basename(targetDirectory),
            seriesPath: targetDirectory,
            isOneshot,
            coverFilename: coverFilename || null,
            metadata: volumeMeta?.metadata || null,
            genres: volumeMeta?.genres || [],
            tags: volumeMeta?.tags || [],
            fileSize: fileBuffer.length,
          });
        }

        await fs.unlink(tempFilePath);

        if (fileIndex === totalFiles - 1) {
          log({
            event: "Files uploaded to library",
            category: "LIBRARY",
            meta: {
              userId: user.id,
              username: user.username,
              isAdmin: user.isAdmin,
              type: libraryType,
              directory: path.basename(targetDirectory),
              filesCount: totalFiles,
              provider: "local",
            },
          });
        }
      }

      try {
        await fs.unlink(coverPartPath);
      } catch {}
      try {
        await fs.unlink(coverNamePath);
      } catch {}
      try {
        await fs.unlink(metaJsonPath);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      chunkIndex,
      totalChunks,
    });
  } catch (e) {
    _err = e;
  } finally {
    if (_err) {
      console.error("[CHUNK UPLOAD] Error:", _err);
      return NextResponse.json(
        { error: _err.message || "Error uploading chunk" },
        { status: 500 }
      );
    }
  }
}
