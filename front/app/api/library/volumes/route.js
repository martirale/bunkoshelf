import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const volumes = await prisma.mangaVolume.findMany({
      include: {
        series: true,
      },
    });

    return NextResponse.json({ success: true, data: volumes });
  } catch (error) {
    console.error("Error al obtener volúmenes:", error);
    return NextResponse.json(
      { success: false, error: "Error al consultar la base de datos" },
      { status: 500 }
    );
  }
}
