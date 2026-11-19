import { canAccessBookVolume } from "@/lib/clubs/access";
import { recordClubProgressActivities } from "@/lib/db/clubs";
import { findBookVolumeBySlug } from "@/lib/db/books/library";
import { findBookProgress, upsertBookProgress } from "@/lib/db/books/reading";
import type { Session } from "@/lib/types";
import { NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { verifySession } from "@/lib/auth/verifySession";
import { toggleSeriesFavorite, toggleVolumeFavorite } from "@/actions/favorites";
import { updateReadState } from "@/actions/read";
import { syncReadingProgress } from "@/actions/progress";
import { queryOne, execute } from "@/lib/db/query";

interface Operation {
  id: string;
  kind: "favorite" | "read" | "progress" | "series-favorite" | "book-progress";
  payload: Record<string, unknown>;
}

async function applyBookProgress(user: Session, payload: Record<string, unknown>) {
  if (typeof payload.slug !== "string") return { error: "Invalid book" };
  const book = await findBookVolumeBySlug(payload.slug);
  if (!book || !(await canAccessBookVolume(user, book.id))) return { error: "Book unavailable" };

  const date = typeof payload.lastReadAt === "string" ? new Date(payload.lastReadAt) : undefined;
  const lastReadAt = date && Number.isFinite(date.getTime()) ? date : undefined;
  const current = await findBookProgress(user.id, book.id);
  const stale = lastReadAt && current?.lastReadAt && lastReadAt < current.lastReadAt;
  const isFavorite = typeof payload.isFavorite === "boolean" ? payload.isFavorite : undefined;
  if (stale && isFavorite === undefined) return { success: true };

  const readingDate = typeof payload.readingDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(payload.readingDate)
    ? payload.readingDate
    : undefined;
  await upsertBookProgress(user.id, book.id, stale ? { isFavorite } : {
    cfi: typeof payload.cfi === "string" ? payload.cfi : undefined,
    chapterHref: typeof payload.chapterHref === "string" ? payload.chapterHref : undefined,
    progression: typeof payload.progression === "number" ? Math.max(0, Math.min(1, payload.progression)) : undefined,
    isRead: typeof payload.isRead === "boolean" ? payload.isRead : undefined,
    isFavorite,
    lastReadAt,
    readingDate,
  });
  await recordClubProgressActivities(user.id, "BOOK_SERIES", book.series.id);
  return { success: true };
}

async function apply(operation: Operation, user: Session) {
  if (operation.kind === "book-progress") return applyBookProgress(user, operation.payload);
  if (operation.kind === "favorite") {
    return toggleVolumeFavorite({ volumeId: String(operation.payload.volumeId || ""), favorite: Boolean(operation.payload.favorite) });
  }
  if (operation.kind === "series-favorite") {
    return toggleSeriesFavorite({ seriesId: String(operation.payload.seriesId || ""), favorite: Boolean(operation.payload.favorite) });
  }
  if (operation.kind === "read") {
    return updateReadState({
      volumeId: String(operation.payload.volumeId || ""),
      read: Boolean(operation.payload.read),
      totalPages: Number(operation.payload.totalPages || 0),
      lastReadAt: typeof operation.payload.lastReadAt === "string" ? operation.payload.lastReadAt : undefined,
      firstRead: typeof operation.payload.firstRead === "string" ? operation.payload.firstRead : undefined,
    });
  }
  return syncReadingProgress({
    volumeSlug: String(operation.payload.volumeSlug || ""),
    lastPage: Number(operation.payload.lastPage || 0),
    totalPages: Number(operation.payload.totalPages || 0),
    lastReadAt: String(operation.payload.lastReadAt || ""),
    date: String(operation.payload.date || ""),
  });
}

export async function POST(request: Request) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { operations?: Operation[] };
  const completed: string[] = [];

  for (const operation of body.operations ?? []) {
    if (!operation?.id || !operation.kind) continue;
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM offline_sync_operations WHERE user_id = $1 AND client_operation_id = $2",
      [user.id, operation.id],
    );
    if (existing) {
      completed.push(operation.id);
      continue;
    }
    const result = await apply(operation, user);
    if (!result || "error" in result) continue;
    await execute(
      "INSERT INTO offline_sync_operations (id, user_id, client_operation_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, client_operation_id) DO NOTHING",
      [createId(), user.id, operation.id],
    );
    completed.push(operation.id);
  }

  return NextResponse.json({ completed });
}
