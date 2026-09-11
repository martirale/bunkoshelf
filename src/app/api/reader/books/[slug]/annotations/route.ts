import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { findBookVolumeBySlug } from "@/lib/db/books/library";
import { createBookAnnotation, deleteBookAnnotation, listBookAnnotations } from "@/lib/db/books/reading";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const volume = await findBookVolumeBySlug((await params).slug);
  if (!volume) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  return NextResponse.json(await listBookAnnotations(user.id, volume.id));
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const volume = await findBookVolumeBySlug((await params).slug);
  const body = await request.json() as { cfiRange?: string; excerpt?: string; note?: string; color?: string };
  if (!volume || !body.cfiRange) return NextResponse.json({ error: "Invalid annotation" }, { status: 400 });
  return NextResponse.json(await createBookAnnotation(user.id, volume.id, {
    cfiRange: body.cfiRange, excerpt: body.excerpt ?? null, note: body.note ?? null,
    color: ["yellow", "green", "blue", "pink"].includes(body.color ?? "") ? body.color! : "yellow",
  }));
}

export async function DELETE(request: Request) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing annotation id" }, { status: 400 });
  await deleteBookAnnotation(user.id, id);
  return new NextResponse(null, { status: 204 });
}
