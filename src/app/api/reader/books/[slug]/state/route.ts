import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { findBookVolumeBySlug } from "@/lib/db/books/library";
import {
  findBookProgress,
  listBookAnnotations,
  listBookBookmarks,
} from "@/lib/db/books/reading";
import { canAccessBookVolume } from "@/lib/clubs/access";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const volume = await findBookVolumeBySlug((await params).slug);
  if (!volume) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  if (!(await canAccessBookVolume(user, volume.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [progress, bookmarks, annotations] = await Promise.all([
    findBookProgress(user.id, volume.id),
    listBookBookmarks(user.id, volume.id),
    listBookAnnotations(user.id, volume.id),
  ]);

  return NextResponse.json({ progress, bookmarks, annotations });
}
