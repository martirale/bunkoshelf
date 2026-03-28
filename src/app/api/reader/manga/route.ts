import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMangaImages } from "@/actions/reader";

export async function POST(req: NextRequest) {
  try {
    const { slug } = (await req.json()) as { slug?: string };

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const result = await getMangaImages({ slug });

    if (!result || "error" in result) {
      return NextResponse.json(
        { error: result?.error ?? "Unknown error" },
        { status: ("status" in (result ?? {})) ? (result as { status: number }).status : 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Reader API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
