import { NextResponse } from "next/server";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import { verifySession } from "@/lib/auth/verifySession";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 300;

const LIBRARY_PATH = path.resolve(process.cwd(), "../library");

export async function GET(request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let _err;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const action = searchParams.get("action");

    if (action === "list") {
      const libraryType = type === "manga" ? "manga" : "books";
      const targetPath = path.join(LIBRARY_PATH, libraryType);

      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      const directories = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      return NextResponse.json({ directories });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    _err = e;
  } finally {
    if (_err) {
      console.error("[UPLOAD] Error in GET:", _err);
      return NextResponse.json(
        { error: _err.message || "Error processing request" },
        { status: 500 }
      );
    }
  }
}

export async function POST(request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let _err;
  let targetDirectory;
  try {
    console.log("[UPLOAD] Starting POST request");

    const formData = await request.formData();
    console.log("[UPLOAD] FormData received");

    const type = formData.get("type");
    const isNew = formData.get("isNew") === "true";
    const files = formData.getAll("files");

    console.log(
      "[UPLOAD] Type:",
      type,
      "isNew:",
      isNew,
      "Files count:",
      files.length
    );

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    const libraryType = type === "manga" ? "manga" : "books";
    const basePath = path.join(LIBRARY_PATH, libraryType);

    console.log("[UPLOAD] Base path:", basePath);

    if (isNew) {
      const newDirectoryName = formData.get("newDirectoryName");
      const isOneshot = formData.get("isOneshot") === "true";
      const suffix = isOneshot ? " [oneshot]" : "";
      targetDirectory = path.join(basePath, `${newDirectoryName}${suffix}`);

      console.log("[UPLOAD] Creating new directory:", targetDirectory);
      await fs.mkdir(targetDirectory, { recursive: true });
      console.log("[UPLOAD] Directory created successfully");
    } else {
      const existingDirectory = formData.get("existingDirectory");
      targetDirectory = path.join(basePath, existingDirectory);
      console.log("[UPLOAD] Using existing directory:", targetDirectory);
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(
        `[UPLOAD] Processing file ${i + 1}/${files.length}: ${
          file.name
        }, size: ${file.size} bytes`
      );

      const filePath = path.join(targetDirectory, file.name);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`[UPLOAD] Writing file to: ${filePath}`);
      await fs.writeFile(filePath, buffer);
      console.log(`[UPLOAD] File ${file.name} written successfully`);
    }

    console.log("[UPLOAD] All files uploaded successfully");

    log({
      event: "Files uploaded to library",
      category: "LIBRARY",
      meta: {
        userId: session.id,
        username: session.username,
        isAdmin: session.isAdmin,
        type: libraryType,
        directory: path.basename(targetDirectory),
        filesCount: files.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Files uploaded successfully",
      directory: path.basename(targetDirectory),
    });
  } catch (e) {
    _err = e;
  } finally {
    if (_err) {
      console.error("[UPLOAD] Error in POST:", _err);
      console.error("[UPLOAD] Error stack:", _err.stack);
      return NextResponse.json(
        { error: _err.message || "Error uploading files" },
        { status: 500 }
      );
    }
  }
}
