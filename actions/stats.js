"use server";

import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function getGenresStats() {
  let error;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    const ignoreList = [
      "shonen",
      "shojo",
      "seinen",
      "josei",
      "kodomo",
      "manhwa",
      "manhua",
      "webcomic",
      "doujinshi",
      "color",
      "oneshot",
    ];
    const ignoreSet = new Set(ignoreList.map((s) => s.toLowerCase()));

    const readVolumes = await prisma.userToVolume.findMany({
      where: {
        userId: user.id,
        isRead: true,
      },
      select: {
        volumeId: true,
      },
    });

    const readVolumeIds = readVolumes.map((v) => v.volumeId);

    if (readVolumeIds.length === 0) {
      return { topGenres: [] };
    }

    const [genres, tags] = await Promise.all([
      prisma.volumeToGenre.findMany({
        where: {
          volumeId: { in: readVolumeIds },
        },
        include: { genre: true },
      }),
      prisma.volumeToTag.findMany({
        where: {
          volumeId: { in: readVolumeIds },
        },
        include: { tag: true },
      }),
    ]);

    const volumeNames = new Map();
    const displayMap = new Map();

    for (const entry of genres) {
      const id = entry.volumeId;
      const name = String(entry.genre.name || "").trim();
      const key = name.toLowerCase();
      if (!displayMap.has(key)) displayMap.set(key, name);
      if (!volumeNames.has(id)) volumeNames.set(id, new Set());
      volumeNames.get(id).add(key);
    }

    for (const entry of tags) {
      const id = entry.volumeId;
      const name = String(entry.tag.name || "").trim();
      const key = name.toLowerCase();
      if (ignoreSet.has(key)) continue;
      if (!displayMap.has(key)) displayMap.set(key, name);
      if (!volumeNames.has(id)) volumeNames.set(id, new Set());
      volumeNames.get(id).add(key);
    }

    const countMap = new Map();

    for (const names of volumeNames.values()) {
      for (const key of names) {
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }
    }

    const sorted = Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({
        genre: displayMap.get(key) || key,
        user: count,
      }));

    return { topGenres: sorted };
  } catch (e) {
    error = e;
  } finally {
    if (error) {
      console.error("Error fetching top genres:", error);
      return {
        error: "Internal Server Error",
        status: 500,
      };
    }
  }
}

export async function getReaderStats() {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const [
    volumesRead,
    readEntries,
    allCompleted,
    allReadDates,
    dailyReading,
    totalVolumes,
    totalSeries,
    userProgressVolumes,
    allFirstReadDates,
    currentChallenge,
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

    prisma.mangaSeries.count({
      where: { isOneshot: false },
    }),

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

    prisma.userToVolume.findMany({
      where: {
        userId: user.id,
        firstRead: { not: null },
      },
      select: {
        firstRead: true,
      },
    }),

    prisma.readingChallenge.findFirst({
      where: {
        userId: user.id,
        year: new Date().getFullYear(),
      },
      select: {
        goal: true,
      },
    }),
  ]);

  const totalTracked = userProgressVolumes.length;
  const totalRead = userProgressVolumes.filter(
    (volume) => volume.usersProgress[0]?.isRead
  ).length;
  const totalUnread = totalVolumes - totalRead;

  const now = new Date();
  const monthlyReadCount = Array(12).fill(0);

  for (const entry of allFirstReadDates) {
    const [yearStr, monthStr] = entry.firstRead.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);

    if (year === now.getFullYear() && month >= 1 && month <= 12) {
      monthlyReadCount[month - 1]++;
    }
  }

  const monthlyReads = monthlyReadCount
    .map((count, index) => ({
      month: index + 1,
      count,
    }))
    .filter((_, index) => index <= now.getMonth());

  const goal = currentChallenge?.goal || 0;
  let monthlyGoal = null;

  if (goal > 0) {
    const currentMonth = now.getMonth() + 1;
    const basePerMonth = Math.floor(goal / 12);
    const remainder = goal % 12;
    const extraStart = 12 - remainder + 1;

    let cumulativeExpected = 0;
    for (let m = 1; m <= currentMonth; m++) {
      cumulativeExpected += basePerMonth + (m >= extraStart ? 1 : 0);
    }

    const previousMonthsRead = monthlyReads
      .filter((entry) => entry.month < currentMonth)
      .reduce((sum, entry) => sum + entry.count, 0);

    monthlyGoal = Math.max(0, cumulativeExpected - previousMonthsRead);
  }

  return {
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
    monthlyReads,
    monthlyGoal,
  };
}
