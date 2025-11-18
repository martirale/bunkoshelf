import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import fs from "fs";
import path from "path";

export async function GET() {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dbPath = path.join(process.cwd(), "prisma", "data", "bunkoshelf.db");

  if (!fs.existsSync(dbPath)) {
    return new NextResponse("Database file not found", { status: 404 });
  }

  const fileStream = fs.readFileSync(dbPath);

  return new NextResponse(fileStream, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="bunkoshelf.db"',
    },
  });
}
