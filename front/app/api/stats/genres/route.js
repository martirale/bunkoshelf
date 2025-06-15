import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/verifySession";

export async function GET() {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Obtener IDs de los volúmenes leídos
    const readVolumes = await prisma.userToVolume.findMany({
      where: {
        userId: user.id,
        isRead: true,
      },
      select: {
        volumeId: true,
      },
    });

    const readVolumeIds = readVolumes.map((v) => v.volumeId);

    if (readVolumeIds.length === 0) {
      return NextResponse.json({ topGenres: [] });
    }

    // 2. Obtener géneros asociados a esos volúmenes
    const genres = await prisma.volumeToGenre.findMany({
      where: {
        volumeId: {
          in: readVolumeIds,
        },
      },
      include: {
        genre: true,
      },
    });

    // 3. Contar ocurrencias de cada género
    const genreCountMap = new Map();

    for (const entry of genres) {
      const name = entry.genre.name;
      genreCountMap.set(name, (genreCountMap.get(name) || 0) + 1);
    }

    // 4. Ordenar por cantidad y tomar los 10 más comunes
    const sorted = Array.from(genreCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([genre, count]) => ({
        genre,
        user: count,
      }));

    return NextResponse.json({ topGenres: sorted });
  } catch (error) {
    console.error("Error fetching top genres:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
