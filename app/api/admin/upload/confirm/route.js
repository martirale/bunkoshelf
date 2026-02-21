import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";

export const dynamic = "force-dynamic";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import { log } from "@/lib/logger";
import crypto from "crypto";

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

    const { files, metadata } = await request.json();
    const { type, isNew, newDirectoryName, existingDirectory } = metadata;

    const libraryType = type === "manga" ? "manga" : "books";
    const directoryName = isNew ? newDirectoryName : existingDirectory;

    for (const file of files) {
      const checksum = generateChecksum();
      const txtFileName = `${file.baseName}.txt`;
      const txtKey = `${file.key.substring(
        0,
        file.key.lastIndexOf("/")
      )}/${txtFileName}`;

      const txtCommand = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: txtKey,
        Body: checksum,
        ContentType: "text/plain",
      });

      await r2Client.send(txtCommand);
    }

    log({
      event: "Files uploaded to library",
      category: "LIBRARY",
      meta: {
        userId: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        type: libraryType,
        directory: directoryName,
        filesCount: files.length,
        provider: "cloud",
        method: "presigned",
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    _err = e;
  } finally {
    if (_err) {
      console.error("[CONFIRM UPLOAD] Error:", _err);
      return NextResponse.json(
        { error: _err.message || "Error confirming upload" },
        { status: 500 }
      );
    }
  }
}
