import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { verifySession } from "@/lib/auth/verifySession";
import { log } from "@/lib/logger";
import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LIBRARY_PATH = path.resolve(process.cwd(), "../library");
const TEMP_PATH = path.resolve(process.cwd(), "../temp");
const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";

function generateChecksum() {
  return crypto.randomBytes(8).toString("hex");
}

async function fileExistsInR2(key) {
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function POST(request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let _err;
  try {
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
    } else {
      await fs.appendFile(tempFilePath, uint8Array);
    }

    if (chunkIndex === totalChunks - 1) {
      const libraryType = type === "manga" ? "manga" : "books";
      const fileBuffer = await fs.readFile(tempFilePath);
      const checksum = generateChecksum();
      const txtFileName = `${path.parse(fileName).name}.txt`;

      if (LIB_PROVIDER === "cloud") {
        const suffix = isOneshot ? " [oneshot]" : "";
        const directoryName = isNew ? newDirectoryName : existingDirectory;
        const r2Key = `library/${libraryType}/${directoryName}${
          isNew ? suffix : ""
        }/${fileName}`;
        const txtKey = `library/${libraryType}/${directoryName}${
          isNew ? suffix : ""
        }/${txtFileName}`;

        const fileExists = await fileExistsInR2(r2Key);

        const command = new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: r2Key,
          Body: fileBuffer,
        });

        await r2Client.send(command);

        const txtCommand = new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: txtKey,
          Body: checksum,
          ContentType: "text/plain",
        });

        await r2Client.send(txtCommand);

        if (!fileExists) {
          await prisma.fileChecksum.create({
            data: { filePath: `/${txtKey}`, checksum },
          });
        }

        await fs.unlink(tempFilePath);

        if (fileIndex === totalFiles - 1) {
          log({
            event: "Files uploaded to library",
            category: "LIBRARY",
            meta: {
              userId: session.id,
              username: session.username,
              isAdmin: session.isAdmin,
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
        if (isNew && fileIndex === 0) {
          const suffix = isOneshot ? " [oneshot]" : "";
          targetDirectory = path.join(basePath, `${newDirectoryName}${suffix}`);
          await fs.mkdir(targetDirectory, { recursive: true });
        } else if (isNew) {
          const suffix = isOneshot ? " [oneshot]" : "";
          targetDirectory = path.join(basePath, `${newDirectoryName}${suffix}`);
        } else {
          targetDirectory = path.join(basePath, existingDirectory);
        }

        const finalPath = path.join(targetDirectory, fileName);
        const txtPath = path.join(targetDirectory, txtFileName);

        let fileExists = false;
        try {
          await fs.access(finalPath);
          fileExists = true;
        } catch {}

        await fs.copyFile(tempFilePath, finalPath);
        await fs.writeFile(txtPath, checksum, "utf8");

        if (!fileExists) {
          await prisma.fileChecksum.create({
            data: { filePath: txtPath, checksum },
          });
        }

        await fs.unlink(tempFilePath);

        if (fileIndex === totalFiles - 1) {
          log({
            event: "Files uploaded to library",
            category: "LIBRARY",
            meta: {
              userId: session.id,
              username: session.username,
              isAdmin: session.isAdmin,
              type: libraryType,
              directory: path.basename(targetDirectory),
              filesCount: totalFiles,
              provider: "local",
            },
          });
        }
      }
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
