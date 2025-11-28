import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function POST(req) {
  let error = null;
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { year, goal, notified } = await req.json();

    if (!year || typeof year !== "number") {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    if (goal !== undefined && (typeof goal !== "number" || goal < 1)) {
      return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
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
        return NextResponse.json(
          { error: "Goal is required for new challenge" },
          { status: 400 }
        );
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

    return NextResponse.json({ challenge });
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("Error updating challenge:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
}
