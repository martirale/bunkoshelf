import { NextResponse } from "next/server";
import { getMangaImages } from "@/actions/reader";

export async function POST(req) {
  try {
    const { slug } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const result = await getMangaImages({ slug });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Reader API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
