import { NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { verifySession } from "@/lib/auth/verifySession";
import { toggleSeriesFavorite, toggleVolumeFavorite } from "@/actions/favorites";
import { updateReadState } from "@/actions/read";
import { syncReadingProgress } from "@/actions/progress";
import { queryOne, execute } from "@/lib/db/query";

interface Operation {
  id: string;
  kind: "favorite" | "read" | "progress" | "series-favorite";
  payload: Record<string, unknown>;
}

async function apply(operation: Operation) {
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
    const result = await apply(operation);
    if (!result || "error" in result) continue;
    await execute(
      "INSERT INTO offline_sync_operations (id, user_id, client_operation_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, client_operation_id) DO NOTHING",
      [createId(), user.id, operation.id],
    );
    completed.push(operation.id);
  }

  return NextResponse.json({ completed });
}
