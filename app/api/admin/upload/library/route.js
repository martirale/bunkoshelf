import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { verifySession } from "@/lib/auth/verifySession";
import { log } from "@/lib/logger";

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
    const formData = await request.formData();

    const type = formData.get("type");
    const isNew = formData.get("isNew") === "true";
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    const libraryType = type === "manga" ? "manga" : "books";
    const basePath = path.join(LIBRARY_PATH, libraryType);

    if (isNew) {
      const newDirectoryName = formData.get("newDirectoryName");
      const isOneshot = formData.get("isOneshot") === "true";
      const suffix = isOneshot ? " [oneshot]" : "";
      targetDirectory = path.join(basePath, `${newDirectoryName}${suffix}`);
      await fs.mkdir(targetDirectory, { recursive: true });
    } else {
      const existingDirectory = formData.get("existingDirectory");
      targetDirectory = path.join(basePath, existingDirectory);
    }

    for (const file of files) {
      const filePath = path.join(targetDirectory, file.name);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filePath, buffer);
    }

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
      return NextResponse.json(
        { error: _err.message || "Error uploading files" },
        { status: 500 }
      );
    }
  }
}
