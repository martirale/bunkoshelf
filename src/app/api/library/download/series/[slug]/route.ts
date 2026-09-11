import { NextResponse, connection } from "next/server";
import { Readable } from "node:stream";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { verifySession } from "@/lib/auth/verifySession";
import {
  findSeriesBySlugBasic,
  listVolumesBySeriesId,
} from "@/lib/db/ingestion";
import r2Client, { R2_BUCKET } from "@/lib/r2";
import { createZipStream } from "@/lib/zipStream";

const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";

export const maxDuration = 300;

function archiveName(filename: string): string {
  return filename.replace(/\\/g, "/").split("/").pop() || "volume";
}

function contentDisposition(filename: string): string {
  const fallbackName = filename
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_");

  return `attachment; filename="${fallbackName || "series"}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
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
      return NextResponse.json({ error: "Missing series slug" }, { status: 400 });
    }

    const series = await findSeriesBySlugBasic(slug);
    if (!series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    const volumes = await listVolumesBySeriesId(series.id);
    if (volumes.length === 0) {
      return NextResponse.json({ error: "Series has no volumes" }, { status: 404 });
    }

    const stream = createZipStream(
      volumes.map((volume) => ({
        name: archiveName(volume.filename),
        size: volume.size,
        stream: async () => {
          const response = await r2Client.send(
            new GetObjectCommand({
              Bucket: R2_BUCKET,
              Key: volume.fullPath.replace(/^\/+/, "").replace(/\\/g, "/"),
            })
          );

          if (!response.Body) {
            throw new Error(`Missing R2 body for ${volume.filename}`);
          }

          return response.Body as AsyncIterable<Uint8Array>;
        },
      }))
    );
    const filename = `${series.title}.zip`;

    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": contentDisposition(filename),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error creating series download:", error);
    return NextResponse.json(
      { error: "Could not prepare the series download" },
      { status: 500 }
    );
  }
}
