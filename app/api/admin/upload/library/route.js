import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const LIBRARY_PATH = path.resolve(process.cwd(), "../library");

export async function GET(request) {
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
  let _err;
  try {
    const formData = await request.formData();
    const type = formData.get("type");
    const isNew = formData.get("isNew") === "true";
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    const libraryType = type === "manga" ? "manga" : "book";
    const basePath = path.join(LIBRARY_PATH, libraryType);

    let targetDirectory;

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
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = path.join(targetDirectory, file.name);
      await fs.writeFile(filePath, buffer);
    }

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
