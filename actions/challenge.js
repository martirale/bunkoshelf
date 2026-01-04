"use server";

import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function getChallenge({ year }) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  if (!year) {
    return { error: "Missing year", status: 400 };
  }

  let challenge = await prisma.readingChallenge.findFirst({
    where: {
      userId: user.id,
      year,
    },
    select: {
      goal: true,
      completed: true,
      notified: true,
    },
  });

  if (!challenge) {
    challenge = await prisma.readingChallenge.create({
      data: {
        userId: user.id,
        year,
        goal: 0,
        completed: 0,
        notified: false,
      },
    });
  }

  return { challenge };
}

export async function updateChallenge({ year, goal, notified }) {
  let error = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!year || typeof year !== "number") {
      return { error: "Invalid year", status: 400 };
    }

    if (goal !== undefined && (typeof goal !== "number" || goal < 1)) {
      return { error: "Invalid goal", status: 400 };
    }

    let challenge = await prisma.readingChallenge.findFirst({
      where: { userId: user.id, year },
    });

    const volumesRead = await prisma.userToVolume.findMany({
      where: {
        userId: user.id,
        isRead: true,
      },
      select: {
        lastReadAt: true,
      },
    });

    const completedCount = volumesRead.filter((vol) => {
      if (!vol.lastReadAt) return false;
      const lastReadDate = new Date(vol.lastReadAt);
      return lastReadDate.getFullYear() === year;
    }).length;

    if (challenge) {
      const dataToUpdate = { completed: completedCount };
      if (goal !== undefined) dataToUpdate.goal = goal;
      if (notified !== undefined) dataToUpdate.notified = notified;

      challenge = await prisma.readingChallenge.update({
        where: { id: challenge.id },
        data: dataToUpdate,
      });
    } else {
      if (goal === undefined) {
        return { error: "Goal is required for new challenge", status: 400 };
      }

      challenge = await prisma.readingChallenge.create({
        data: {
          userId: user.id,
          year,
          goal,
          completed: completedCount,
          notified: notified ?? false,
        },
      });
    }

    return { challenge };
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("Error updating challenge:", error);
      return { error: "Internal server error", status: 500 };
    }
  }
}
