import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year } = await req.json();

  if (!year || typeof year !== "number") {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  let challenge = await prisma.readingChallenge.findFirst({
    where: { userId: user.id, year },
  });

  if (!challenge) {
    challenge = await prisma.readingChallenge.create({
      data: {
        userId: user.id,
        year,
        goal: 0,
        completed: 1,
        notified: false,
      },
    });
  } else {
    challenge = await prisma.readingChallenge.update({
      where: { id: challenge.id },
      data: { completed: { increment: 1 } },
    });
  }

  return NextResponse.json({ challenge });
}
