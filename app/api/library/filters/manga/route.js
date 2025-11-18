import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const genres = await prisma.genre.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const tags = await prisma.tag.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ genres, tags });
  } catch (error) {
    console.error("Error fetching filters:", error);
    return new NextResponse("Error fetching filters", { status: 500 });
  }
}
