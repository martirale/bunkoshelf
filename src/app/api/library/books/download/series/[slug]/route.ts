import { NextResponse, connection } from "next/server";
import { Readable } from "node:stream";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { verifySession } from "@/lib/auth/verifySession";
import { findBookSeriesBySlug, listBookVolumes } from "@/lib/db/books/library";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import { createZipStream } from "@/lib/zipStream";

function archiveName(filename: string): string {
  return filename.replace(/\\/g, "/").split("/").pop() || "book.epub";
}

function contentDisposition(filename: string): string {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${fallback || "series.zip"}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export const maxDuration = 300;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connection();
    const user = await verifySession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if ((process.env.LIB_PROVIDER || "local") !== "cloud") return NextResponse.json({ error: "Cloud storage is not enabled" }, { status: 404 });
    const { slug } = await params;
    const series = await findBookSeriesBySlug(slug);
    if (!series) return NextResponse.json({ error: "Series not found" }, { status: 404 });
    const volumes = await listBookVolumes({ seriesSlug: slug });
    if (!volumes.length) return NextResponse.json({ error: "Series has no books" }, { status: 404 });
    const objects = await Promise.all(volumes.map(async (volume) => {
      const key = volume.fullPath.replace(/^\/+/, "").replace(/\\/g, "/");
      const head = await r2Client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
      if (head.ContentLength === undefined) throw new Error(`Missing R2 size for ${volume.filename}`);
      return { ...volume, key, size: head.ContentLength };
    }));
    const stream = createZipStream(objects.map((volume) => ({
      name: archiveName(volume.filename),
      size: volume.size,
      stream: async () => {
        const response = await r2Client.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: volume.key }));
        if (!response.Body) throw new Error(`Missing R2 body for ${volume.filename}`);
        return response.Body as AsyncIterable<Uint8Array>;
      },
    })));
    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": contentDisposition(`${series.title}.zip`),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error creating book series download:", error);
    return NextResponse.json({ error: "Could not prepare the series download" }, { status: 500 });
  }
}
