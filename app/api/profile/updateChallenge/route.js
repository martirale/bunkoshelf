import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year, goal, notified } = await req.json();

  if (!year || typeof year !== "number") {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  // Validar goal solo si viene en la petición
  if (goal !== undefined && (typeof goal !== "number" || goal < 1)) {
    return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
  }

  // Intentar encontrar challenge
  let challenge = await prisma.readingChallenge.findFirst({
    where: { userId: user.id, year },
  });

  if (challenge) {
    // Construir objeto para update solo con campos que vienen
    const dataToUpdate = {};
    if (goal !== undefined) dataToUpdate.goal = goal;
    if (notified !== undefined) dataToUpdate.notified = notified;

    challenge = await prisma.readingChallenge.update({
      where: { id: challenge.id },
      data: dataToUpdate,
    });
  } else {
    // Crear nuevo challenge, goal es obligatorio para crear
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
        notified: notified ?? false,
      },
    });
  }

  return NextResponse.json({ challenge });
}
