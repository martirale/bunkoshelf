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
    totalSeries,
    userProgressVolumes,
  ] = await Promise.all([
    // volumesRead
    prisma.userToVolume.findMany({
      where: {
        userId: user.id,
        isRead: true,
      },
      select: { id: true, volumeId: true, lastReadAt: true },
    }),

    // readEntries
    prisma.userToVolume.findMany({
      where: {
        userId: user.id,
        lastReadAt: { not: null },
      },
      select: { lastReadAt: true },
    }),

    // allCompleted
    prisma.userToVolume.findMany({
      where: {
        userId: user.id,
        isRead: true,
      },
      select: { id: true, volumeId: true },
    }),

    // allReadDates
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

    // dailyReading
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

    // totalVolumes
    prisma.mangaVolume.count(),

    // totalSeries
    prisma.mangaSeries.count({
      where: { isOneshot: false },
    }),

    // userProgressVolumes
    prisma.mangaVolume.findMany({
      where: {
        usersProgress: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        usersProgress: {
          where: {
            userId: user.id,
          },
          select: {
            isRead: true,
          },
        },
      },
    }),
  ]);

  const totalTracked = userProgressVolumes.length;
  const totalRead = userProgressVolumes.filter(
    (volume) => volume.usersProgress[0]?.isRead
  ).length;
  const totalUnread = totalVolumes - totalRead;

  return NextResponse.json({
    volumesRead,
    readEntries,
    allCompleted,
    allReadDates,
    dailyReading,
    totalVolumes,
    totalSeries,
    readingProgressSummary: {
      totalTracked,
      totalRead,
      totalUnread,
    },
  });
}
