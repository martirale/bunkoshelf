import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/verifySession";

export async function GET() {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ignoreList = [
      "shonen",
      "shojo",
      "seinen",
      "josei",
      "kodomo",
      "manhwa",
      "manhua",
      "webcomic",
      "doujinshi",
      "color",
      "one-shot",
    ];

    // 1. Obtener IDs de los volúmenes leídos por el usuario
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

    // 2. Obtener géneros y etiquetas de esos volúmenes
    const [genres, tags] = await Promise.all([
      prisma.volumeToGenre.findMany({
        where: {
          volumeId: { in: readVolumeIds },
        },
        include: { genre: true },
      }),
      prisma.volumeToTag.findMany({
        where: {
          volumeId: { in: readVolumeIds },
        },
        include: { tag: true },
      }),
    ]);

    // 3. Contar géneros
    const countMap = new Map();

    for (const entry of genres) {
      const name = entry.genre.name;
      countMap.set(name, (countMap.get(name) || 0) + 1);
    }

    // 4. Contar etiquetas útiles (omitiendo las de la lista ignorada)
    for (const entry of tags) {
      const name = entry.tag.name;
      if (!ignoreList.includes(name)) {
        countMap.set(name, (countMap.get(name) || 0) + 1);
      }
    }

    // 5. Ordenar y tomar el top 10
    const sorted = Array.from(countMap.entries())
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
