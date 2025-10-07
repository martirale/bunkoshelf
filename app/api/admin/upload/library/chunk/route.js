import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { verifySession } from "@/lib/auth/verifySession";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LIBRARY_PATH = path.resolve(process.cwd(), "../library");
const TEMP_PATH = path.resolve(process.cwd(), "../temp");

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

    const bytes = await chunk.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (chunkIndex === 0) {
      await fs.writeFile(tempFilePath, buffer);
    } else {
      await fs.appendFile(tempFilePath, buffer);
    }

    if (chunkIndex === totalChunks - 1) {
      const libraryType = type === "manga" ? "manga" : "books";
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
      await fs.rename(tempFilePath, finalPath);

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
          },
        });
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
      return NextResponse.json(
        { error: _err.message || "Error uploading chunk" },
        { status: 500 }
      );
    }
  }
}
