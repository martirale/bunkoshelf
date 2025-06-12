import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/verifySession";

export async function GET() {
  const user = await verifySession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    volumesRead,
    readEntries,
    allCompleted,
    allReadDates,
    dailyReading,
    totalVolumes,
  ] = await Promise.all([
    prisma.userToVolume.findMany({
      where: {
        userId: user.id,
        isRead: true,
      },
      select: { id: true, volumeId: true, lastReadAt: true },
    }),

    prisma.userToVolume.findMany({
      where: {
        userId: user.id,
        lastReadAt: { not: null },
      },
      select: { lastReadAt: true },
    }),

    prisma.userToVolume.findMany({
      where: {
        userId: user.id,
        isRead: true,
      },
      select: { id: true, volumeId: true },
    }),

    prisma.userToVolume.findMany({
      where: {
        userId: user.id,
        lastReadAt: { not: null },
      },
      orderBy: {
        lastReadAt: "desc",
      },
      select: { lastReadAt: true },
    }),

    prisma.dailyReadingLog.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        date: "desc",
      },
      select: {
        date: true,
      },
    }),

    prisma.mangaVolume.count(),
  ]);

  return NextResponse.json({
    volumesRead,
    readEntries,
    allCompleted,
    allReadDates,
    dailyReading,
    totalVolumes,
  });
}
