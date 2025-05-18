import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
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
