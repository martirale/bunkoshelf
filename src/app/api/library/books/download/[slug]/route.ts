import { NextResponse, connection } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { verifySession } from "@/lib/auth/verifySession";
import { findBookFileBySlug } from "@/lib/db/books/library";
import r2Client, { R2_BUCKET } from "@/lib/r2";

function contentDisposition(filename: string): string {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${fallback || "book.epub"}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connection();
    const user = await verifySession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if ((process.env.LIB_PROVIDER || "local") !== "cloud") return NextResponse.json({ error: "Cloud storage is not enabled" }, { status: 404 });
    const { slug } = await params;
    const volume = await findBookFileBySlug(slug);
    if (!volume) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: volume.fullPath.replace(/^\/+/, "").replace(/\\/g, "/"),
      ResponseContentDisposition: contentDisposition(volume.filename),
    });
    return NextResponse.redirect(await getSignedUrl(r2Client, command, { expiresIn: 300 }), 302);
  } catch (error) {
    console.error("Error generating book download URL:", error);
    return NextResponse.json({ error: "Could not prepare the book download" }, { status: 500 });
  }
}
