import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { findBookVolumeBySlug } from "@/lib/db/books/library";
import { createBookBookmark, deleteBookBookmark, listBookBookmarks } from "@/lib/db/books/reading";

async function getVolume(slug: string) { return findBookVolumeBySlug(slug); }

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const volume = await getVolume((await params).slug);
  if (!volume) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  return NextResponse.json(await listBookBookmarks(user.id, volume.id));
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const volume = await getVolume((await params).slug);
  const body = await request.json() as { cfi?: string; label?: string; chapterLabel?: string };
  if (!volume || !body.cfi) return NextResponse.json({ error: "Invalid bookmark" }, { status: 400 });
  return NextResponse.json(await createBookBookmark(user.id, volume.id, { cfi: body.cfi, label: body.label ?? null, chapterLabel: body.chapterLabel ?? null }));
}

export async function DELETE(request: Request) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing bookmark id" }, { status: 400 });
  await deleteBookBookmark(user.id, id);
  return new NextResponse(null, { status: 204 });
}
