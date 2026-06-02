import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMangaImages, getReadingProgress } from "@/actions/reader";

export async function POST(req: NextRequest) {
  try {
    const { slug, includeProgress } = (await req.json()) as {
      slug?: string;
      includeProgress?: boolean;
    };

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

    const progress = includeProgress
      ? await getReadingProgress({ slug })
      : undefined;

    return NextResponse.json({ ...result, progress });
  } catch (err) {
    console.error("Reader API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
