import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const user = await verifySession();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { volumeSlug, lastPage, totalPages, lastReadAt } = body;

  if (!volumeSlug || lastPage == null || totalPages == null || !lastReadAt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const volume = await prisma.mangaVolume.findUnique({
      where: { slug: volumeSlug },
      select: { id: true },
    });

    if (!volume) {
      return NextResponse.json({ error: "Volume not found" }, { status: 404 });
    }

    await prisma.userToVolume.upsert({
      where: {
        userId_volumeId: {
          userId: user.id,
          volumeId: volume.id,
        },
      },
      update: {
        lastPage,
        totalPages,
        lastReadAt,
        isRead: lastPage >= totalPages - 1,
      },
      create: {
        userId: user.id,
        volumeId: volume.id,
        lastPage,
        totalPages,
        lastReadAt,
        isRead: lastPage >= totalPages - 1,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating reading progress:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
