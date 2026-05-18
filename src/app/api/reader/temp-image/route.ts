import { NextResponse, connection } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import fs from "fs/promises";
import path from "path";

const CONTENT_TYPE_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(req: NextRequest) {
  try {
    await connection();

    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawPath = searchParams.get("path");

    if (!rawPath) {
      return new Response("Missing path", { status: 400 });
    }

    const filePath = decodeURIComponent(rawPath);
    const ext = path.extname(filePath).toLowerCase();

    const imageBuffer = await fs.readFile(filePath);

    const contentType = CONTENT_TYPE_MAP[ext] || "application/octet-stream";

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Image serving error:", err);
    return new Response("Error reading image", { status: 500 });
  }
}
