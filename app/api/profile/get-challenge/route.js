import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));

  if (!year) {
    return NextResponse.json({ error: "Missing year" }, { status: 400 });
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

  return NextResponse.json({ challenge });
}
