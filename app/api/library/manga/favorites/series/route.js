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
    const seriesId =
      typeof body.seriesId === "string"
        ? body.seriesId
        : body.seriesId == null
        ? ""
        : String(body.seriesId);
    const favorite = body.favorite === true || String(body.favorite) === "true";

    if (
      typeof seriesId !== "string" ||
      !seriesId ||
      typeof favorite !== "boolean"
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await prisma.userToSeries.upsert({
      where: {
        userId_seriesId: {
          userId: user.id,
          seriesId: seriesId,
        },
      },
      update: {
        isFavorite: favorite,
      },
      create: {
        userId: user.id,
        seriesId: seriesId,
        isFavorite: favorite,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    error = e;
  } finally {
    if (error) {
      console.error("Error updating favorite (series):", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
}
