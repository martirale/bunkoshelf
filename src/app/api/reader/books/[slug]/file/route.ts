import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { findBookVolumeBySlug } from "@/lib/db/books/library";
import { readBookFile } from "@/lib/books/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  const volume = await findBookVolumeBySlug(slug);
  if (!volume) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  const file = await readBookFile(volume.fullPath);
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/epub+zip",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(volume.filename)}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
