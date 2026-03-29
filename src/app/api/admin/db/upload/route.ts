import { NextResponse, NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const SQLITE_MAGIC = Buffer.from("SQLite format 3\0");
  if (buffer.length < 16 || !buffer.subarray(0, 16).equals(SQLITE_MAGIC)) {
    return NextResponse.json(
      { error: "The file is not a valid SQLite database" },
      { status: 400 }
    );
  }

  const dbPath = path.join(process.cwd(), "prisma", "data", "bunkoshelf.db");

  await prisma.$disconnect();

  fs.writeFileSync(dbPath, buffer);

  return NextResponse.json({ success: true });
}
