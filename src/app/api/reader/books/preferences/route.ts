import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { getBookReaderPreferences, saveBookReaderPreferences, type BookReaderPreferences } from "@/lib/db/books/reading";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getBookReaderPreferences(user.id));
}

export async function PUT(request: Request) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = await request.json() as BookReaderPreferences;
  if (!(["light", "sepia", "dark"] as string[]).includes(input.theme) || !(["paginated", "scrolled-continuous"] as string[]).includes(input.flow) || !(["serif", "sans"] as string[]).includes(input.fontFamily)) {
    return NextResponse.json({ error: "Invalid reader preferences" }, { status: 400 });
  }
  await saveBookReaderPreferences(user.id, { ...input, fontSize: Math.min(160, Math.max(80, input.fontSize)), lineHeight: Math.min(2.4, Math.max(1.2, input.lineHeight)), margin: Math.min(80, Math.max(0, input.margin)), columnWidth: Math.min(1200, Math.max(320, input.columnWidth)) });
  return new NextResponse(null, { status: 204 });
}
