import { NextResponse } from "next/server";
import { findBookVolumeBySlug } from "@/lib/db/books/library";
import { getEpubEntry } from "@/lib/books/epubParser";
import { readBookFile } from "@/lib/books/storage";
import { verifySession } from "@/lib/auth/verifySession";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  if (!(await verifySession())) return NextResponse.json({ error: "Cover not found" }, { status: 404 });
  const { slug: parts } = await params;
  const slug = parts[0];
  if (!slug) return NextResponse.json({ error: "Missing book" }, { status: 400 });
  const volume = await findBookVolumeBySlug(slug);
  if (!volume?.metadata.coverPath) return NextResponse.json({ error: "Cover not found" }, { status: 404 });
  const cover = getEpubEntry(await readBookFile(volume.fullPath), volume.metadata.coverPath);
  if (!cover) return NextResponse.json({ error: "Cover not found" }, { status: 404 });
  const extension = volume.metadata.coverPath.split(".").pop()?.toLowerCase();
  const contentType = extension === "png" ? "image/png"
    : extension === "webp" ? "image/webp"
      : extension === "gif" ? "image/gif"
        : extension === "svg" ? "image/svg+xml"
          : "image/jpeg";
  return new NextResponse(new Uint8Array(cover), { headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" } });
}
