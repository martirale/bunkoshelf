import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      "oneshot",
    ];
    const ignoreSet = new Set(ignoreList.map((s) => s.toLowerCase()));

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

    const volumeNames = new Map();
    const displayMap = new Map();

    for (const entry of genres) {
      const id = entry.volumeId;
      const name = String(entry.genre.name || "").trim();
      const key = name.toLowerCase();
      if (!displayMap.has(key)) displayMap.set(key, name);
      if (!volumeNames.has(id)) volumeNames.set(id, new Set());
      volumeNames.get(id).add(key);
    }

    for (const entry of tags) {
      const id = entry.volumeId;
      const name = String(entry.tag.name || "").trim();
      const key = name.toLowerCase();
      if (ignoreSet.has(key)) continue;
      if (!displayMap.has(key)) displayMap.set(key, name);
      if (!volumeNames.has(id)) volumeNames.set(id, new Set());
      volumeNames.get(id).add(key);
    }

    const countMap = new Map();

    for (const names of volumeNames.values()) {
      for (const key of names) {
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }
    }

    const sorted = Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({
        genre: displayMap.get(key) || key,
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
