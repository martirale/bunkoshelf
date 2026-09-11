import { NextResponse, connection } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { verifySession } from "@/lib/auth/verifySession";
import { findVolumeBySlugBasic } from "@/lib/db/ingestion";
import r2Client, { R2_BUCKET } from "@/lib/r2";

const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";

function contentDisposition(filename: string): string {
  const fallbackName = filename
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_");

  return `attachment; filename="${fallbackName || "volume"}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connection();

    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (LIB_PROVIDER !== "cloud") {
      return NextResponse.json({ error: "Cloud storage is not enabled" }, { status: 404 });
    }

    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Missing volume slug" }, { status: 400 });
    }

    const volume = await findVolumeBySlugBasic(slug);
    if (!volume) {
      return NextResponse.json({ error: "Volume not found" }, { status: 404 });
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: volume.fullPath.replace(/^\/+/, "").replace(/\\/g, "/"),
      ResponseContentDisposition: contentDisposition(volume.filename),
    });
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });

    return NextResponse.redirect(signedUrl, 302);
  } catch (error) {
    console.error("Error generating volume download URL:", error);
    return NextResponse.json(
      { error: "Could not prepare the volume download" },
      { status: 500 }
    );
  }
}
