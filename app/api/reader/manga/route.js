import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import path from "path";
import prisma from "@/lib/prisma";
import { extractImagesCbz } from "@/lib/reader/manga/cbz";
import { extractImagesCbr } from "@/lib/reader/manga/cbr";

const activeVolumes = new Map();
const LIB_PROVIDER = process.env.LIB_PROVIDER || "local";

function getExtractorForFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".cbz" || ext === ".zip") {
    return extractImagesCbz;
  }

  if (ext === ".cbr" || ext === ".rar") {
    return extractImagesCbr;
  }

  return null;
}

export async function POST(req) {
  let error = null;

  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const volume = await prisma.mangaVolume.findUnique({
      where: { slug },
    });

    if (!volume) {
      return NextResponse.json({ error: "Volume not found" }, { status: 404 });
    }

    const extractor = getExtractorForFile(volume.fullPath);

    if (!extractor) {
      return NextResponse.json(
        { error: "Unsupported file format" },
        { status: 400 }
      );
    }

    const result = await extractor(volume, slug, LIB_PROVIDER, activeVolumes);

    return NextResponse.json(result);
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("Reader error:", error);
      return NextResponse.json(
        { error: "Failed to read archive" },
        { status: 500 }
      );
    }
  }
}
