import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import r2Client, { R2_BUCKET } from "@/lib/r2";

export const dynamic = "force-dynamic";

const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";

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

    if (LIB_PROVIDER !== "cloud") {
      return NextResponse.json({ useChunks: true });
    }

    const { fileName, metadata } = await request.json();
    const { type, isNew, newDirectoryName, isOneshot, existingDirectory } =
      metadata;

    const libraryType = type === "manga" ? "manga" : "books";
    const suffix = isOneshot ? " [oneshot]" : "";
    const directoryName = isNew ? newDirectoryName : existingDirectory;
    const r2Key = `library/${libraryType}/${directoryName}${
      isNew ? suffix : ""
    }/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600,
    });

    return NextResponse.json({ presignedUrl, key: r2Key });
  } catch (e) {
    _err = e;
  } finally {
    if (_err) {
      console.error("[PRESIGNED URL] Error:", _err);
      return NextResponse.json(
        { error: _err.message || "Error generating presigned URL" },
        { status: 500 }
      );
    }
  }
}
