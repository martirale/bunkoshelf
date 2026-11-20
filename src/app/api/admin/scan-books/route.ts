import { recoverLibraryConversions } from "@/lib/db/seriesConversion";
import { withLibraryStorageLock } from "@/lib/db/libraryStorageLock";
import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { scanBooks } from "@/lib/jobs/scan/books";

export async function POST() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const result = await withLibraryStorageLock(async () => {
      await recoverLibraryConversions();
      return scanBooks();
    });
    return NextResponse.json({ ok: result.errors.length === 0, ...result });
  } catch (error) {
    if (error instanceof Error && error.message === "busy") {
      return NextResponse.json({ ok: false, error: "Library storage is busy" }, { status: 409 });
    }
    throw error;
  }
}
