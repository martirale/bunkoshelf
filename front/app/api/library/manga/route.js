import { NextResponse } from "next/server";
import { scanMangaLibrary } from "@/lib/library/scanManga";

export async function GET() {
  const manga = await scanMangaLibrary();
  return NextResponse.json(manga);
}
