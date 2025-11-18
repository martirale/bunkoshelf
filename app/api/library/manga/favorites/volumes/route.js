import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function POST(req) {
  let error;
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const volumeId =
      typeof body.volumeId === "string"
        ? body.volumeId
        : body.volumeId == null
        ? ""
        : String(body.volumeId);
    const favorite = body.favorite === true || String(body.favorite) === "true";

    if (
      typeof volumeId !== "string" ||
      !volumeId ||
      typeof favorite !== "boolean"
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await prisma.userToVolume.upsert({
      where: {
        userId_volumeId: {
          userId: user.id,
          volumeId: volumeId,
        },
      },
      update: {
        isFavorite: favorite,
      },
      create: {
        userId: user.id,
        volumeId: volumeId,
        isFavorite: favorite,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    error = e;
  } finally {
    if (error) {
      console.error("Error updating favorite (volume):", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
}
