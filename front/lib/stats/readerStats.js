import prisma from "../prisma";
import { verifySession } from "../auth/verifySession";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

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

  // Formatea fecha a "YYYY-MM-DD" en zona local del servidor
  function formatLocalDate(date) {
    if (!date) return null;
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  // Días únicos leídos este mes (formateados localmente)
  const uniqueDays = new Set(
    readDaysRaw
      .map((entry) => formatLocalDate(entry.lastReadAt))
      .filter(Boolean)
  );

  const lastReadDate = allReadDatesRaw.length
    ? allReadDatesRaw[0].lastReadAt
    : null;

  const allReadDates = allReadDatesRaw
    .map((entry) => entry.lastReadAt?.toISOString())
    .filter(Boolean);

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
    allReadDates,
  };
}
