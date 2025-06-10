import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const user = await verifySession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));

  if (!year) {
    return NextResponse.json({ error: "Missing year" }, { status: 400 });
  }

  const challenge = await prisma.readingChallenge.findFirst({
    where: {
      userId: user.id,
      year,
    },
  });

  const userVolumes = await prisma.userToVolume.findMany({
    where: {
      userId: user.id,
      isRead: true,
    },
  });

  return NextResponse.json({
    challenge,
    progress: userVolumes.length,
  });
}
