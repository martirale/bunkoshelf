import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const series = await prisma.mangaSeries.findMany({
      include: {
        volumes: true,
      },
    });

    const formatted = series.map((s) => {
      if (s.isOneshot && s.volumes.length === 1) {
        return {
          ...s,
          volumeSlug: s.volumes[0].slug,
        };
      }

      return s;
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error al obtener los datos desde la DB:", error);
    return NextResponse.json(
      { success: false, error: "Error al consultar la base de datos" },
      { status: 500 }
    );
  }
}
