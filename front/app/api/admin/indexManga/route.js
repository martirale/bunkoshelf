import { indexMangaLibrary } from "@/lib/library/indexManga";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Ejecutar el indexado
    await indexMangaLibrary();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
