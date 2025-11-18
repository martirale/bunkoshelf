import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const volume = await prisma.mangaVolume.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!volume) {
      return NextResponse.json({ error: "Volume not found" }, { status: 404 });
    }

    const progress = await prisma.userToVolume.findUnique({
      where: {
        userId_volumeId: {
          userId: user.id,
          volumeId: volume.id,
        },
      },
      select: {
        lastPage: true,
        totalPages: true,
        lastReadAt: true,
      },
    });

    if (!progress) {
      return NextResponse.json({ lastPage: 0 }, { status: 200 });
    }

    return NextResponse.json(progress);
  } catch (err) {
    console.error("Error fetching progress:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
