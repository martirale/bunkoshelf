import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";
import { sortByPaddedTitle } from "@/lib/utils";

export async function GET() {
  try {
    const currentUser = await verifySession();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let volumes = await prisma.mangaVolume.findMany({
      include: {
        series: true,
        metadataObj: true,
        usersProgress: {
          where: {
            userId: currentUser.id,
          },
        },
      },
    });

    // Ordena los volúmenes por su título numérico padded
    volumes = sortByPaddedTitle(volumes);

    return NextResponse.json({ success: true, data: volumes });
  } catch (error) {
    console.error("Error al obtener volúmenes:", error);
    return NextResponse.json(
      { success: false, error: "Error al consultar la base de datos" },
      { status: 500 }
    );
  }
}
