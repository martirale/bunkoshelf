import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const user = await verifySession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { year, goal } = await req.json();

  if (!year || !goal || typeof goal !== "number" || goal < 1) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Intenta actualizar el challenge existente
  let challenge = await prisma.readingChallenge.findFirst({
    where: { userId: user.id, year },
  });

  if (challenge) {
    challenge = await prisma.readingChallenge.update({
      where: { id: challenge.id },
      data: { goal },
    });
  } else {
    // Si no existe, crea uno nuevo
    challenge = await prisma.readingChallenge.create({
      data: {
        userId: user.id,
        year,
        goal,
      },
    });
  }

  return NextResponse.json({ challenge });
}
