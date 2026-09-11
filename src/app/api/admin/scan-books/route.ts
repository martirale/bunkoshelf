import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { scanBooks } from "@/lib/jobs/scan/books";

export async function POST() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await scanBooks();
  return NextResponse.json({ ok: result.errors.length === 0, ...result });
}
