import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { verifySession } from "@/lib/auth/verifySession";

export const dynamic = "force-dynamic";

const LIBRARY_PATH = path.resolve(process.cwd(), "../library");

export async function GET(request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let _err;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const action = searchParams.get("action");

    if (action === "list") {
      const libraryType = type === "manga" ? "manga" : "books";
      const targetPath = path.join(LIBRARY_PATH, libraryType);

      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      const directories = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      return NextResponse.json({ directories });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    _err = e;
  } finally {
    if (_err) {
      return NextResponse.json(
        { error: _err.message || "Error processing request" },
        { status: 500 }
      );
    }
  }
}
