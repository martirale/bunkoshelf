import prisma from "../prisma";
import { verifySession } from "../auth/verifySession";
import { startOfMonth, endOfMonth, subMonths, startOfDay } from "date-fns";

export async function getReaderStats() {
  const user = await verifySession();
  if (!user) return null;

  const now = new Date();

  const startOfThisMonth = startOfMonth(now);
  const endOfThisMonth = endOfMonth(now);

  const startOfLastMonth = startOfMonth(subMonths(now, 1));
  const endOfLastMonth = endOfMonth(subMonths(now, 1));

  const [
    readThisMonth,
    readDaysRaw,
    completedAllTime,
    readLastMonth,
    allReadDatesRaw,
  ] = await Promise.all([
    prisma.userToVolume.count({
      where: {
        userId: user.id,
        isRead: true,
        lastReadAt: {
          gte: startOfThisMonth,
          lte: endOfThisMonth,
        },
      },
    }),

    prisma.userToVolume.findMany({
      where: {
        userId: user.id,
        lastReadAt: {
          gte: startOfThisMonth,
          lte: endOfThisMonth,
        },
      },
      select: {
        lastReadAt: true,
      },
    }),

    prisma.userToVolume.count({
      where: {
        userId: user.id,
        isRead: true,
      },
    }),

    prisma.userToVolume.count({
      where: {
        userId: user.id,
        isRead: true,
        lastReadAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    }),

    prisma.userToVolume.findMany({
      where: {
        userId: user.id,
        lastReadAt: {
          not: null,
        },
      },
      orderBy: {
        lastReadAt: "desc",
      },
      select: {
        lastReadAt: true,
      },
    }),
  ]);

  // contar días únicos este mes (solo fecha en UTC)
  const uniqueDays = new Set(
    readDaysRaw
      .map((entry) => entry.lastReadAt?.toISOString().slice(0, 10))
      .filter(Boolean)
  );

  // última fecha leída
  const lastReadDate = allReadDatesRaw.length
    ? allReadDatesRaw[0].lastReadAt
    : null;

  return {
    currentMonth: {
      totalRead: readThisMonth,
      readDays: uniqueDays.size,
    },
    totalCompleted: completedAllTime,
    previousMonth: {
      totalRead: readLastMonth,
    },
    lastReadDate,
    allReadDates: allReadDatesRaw.map((entry) => entry.lastReadAt),
  };
}
