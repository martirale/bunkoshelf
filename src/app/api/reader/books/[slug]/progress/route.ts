import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { findBookVolumeBySlug } from "@/lib/db/books/library";
import { findBookProgress, upsertBookProgress } from "@/lib/db/books/reading";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const volume = await findBookVolumeBySlug((await params).slug);
  if (!volume) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  return NextResponse.json(await findBookProgress(user.id, volume.id));
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const volume = await findBookVolumeBySlug((await params).slug);
  if (!volume) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  const body = await request.json() as Record<string, unknown>;
  const progression = typeof body.progression === "number" ? Math.min(1, Math.max(0, body.progression)) : undefined;
  const readingDate = typeof body.readingDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.readingDate)
    ? body.readingDate
    : undefined;
  const isRead = typeof body.isRead === "boolean" ? body.isRead : progression === 1 ? true : undefined;
  const hasReadingLocation = typeof body.cfi === "string";
  const result = await upsertBookProgress(user.id, volume.id, {
    cfi: typeof body.cfi === "string" ? body.cfi : undefined,
    progression,
    chapterHref: typeof body.chapterHref === "string" ? body.chapterHref : undefined,
    chapterLabel: typeof body.chapterLabel === "string" ? body.chapterLabel : undefined,
    isRead,
    isFavorite: typeof body.isFavorite === "boolean" ? body.isFavorite : undefined,
    personalRating: typeof body.personalRating === "number" ? body.personalRating : undefined,
    lastReadAt: hasReadingLocation || isRead === true ? new Date() : undefined,
    readingDate,
  });
  return NextResponse.json(result);
}
