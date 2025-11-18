import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const series = await prisma.mangaSeries.findMany({
      include: {
        volumes: {
          include: {
            metadataObj: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: series });
  } catch (error) {
    console.error("Error al obtener series:", error);
    return NextResponse.json(
      { success: false, error: "Error al consultar la base de datos" },
      { status: 500 }
    );
  }
}
