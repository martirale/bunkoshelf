"use server";

import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function syncReadingProgress({
  volumeSlug,
  lastPage,
  totalPages,
  lastReadAt,
  date,
  firstRead,
}) {
  let error = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!volumeSlug || lastPage == null || totalPages == null || !lastReadAt) {
      return { error: "Missing fields", status: 400 };
    }

    const volume = await prisma.mangaVolume.findUnique({
      where: { slug: volumeSlug },
      select: { id: true },
    });

    if (!volume) {
      return { error: "Volume not found", status: 404 };
    }

    const userId = user.id;
    const volumeId = volume.id;

    const isNowRead = lastPage >= totalPages - 1;

    const existing = await prisma.userToVolume.findUnique({
      where: {
        userId_volumeId: {
          userId,
          volumeId,
        },
      },
      select: {
        isRead: true,
        firstRead: true,
      },
    });

    const wasRead = existing?.isRead || false;

    const shouldSetFirstRead =
      isNowRead && (!existing?.isRead || !existing?.firstRead) && !!firstRead;

    await prisma.userToVolume.upsert({
      where: {
        userId_volumeId: {
          userId,
          volumeId,
        },
      },
      update: {
        lastPage,
        totalPages,
        lastReadAt,
        isRead: isNowRead,
        ...(shouldSetFirstRead && { firstRead }),
      },
      create: {
        userId,
        volumeId,
        lastPage,
        totalPages,
        lastReadAt,
        isRead: isNowRead,
        ...(shouldSetFirstRead && { firstRead }),
      },
    });

    if (!wasRead && isNowRead) {
      const currentYear = new Date().getFullYear();
      await prisma.readingChallenge.upsert({
        where: {
          userId_year: {
            userId: user.id,
            year: currentYear,
          },
        },
        update: {
          completed: { increment: 1 },
        },
        create: {
          userId: user.id,
          year: currentYear,
          goal: 0,
          completed: 1,
          notified: false,
        },
      });
    }

    const existingLog = await prisma.dailyReadingLog.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
    });

    if (!existingLog) {
      await prisma.dailyReadingLog.create({
        data: {
          userId,
          date,
        },
      });
    }

    return { success: true };
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("Error updating reading progress:", error);
      return { error: "Server error", status: 500 };
    }
  }
}
