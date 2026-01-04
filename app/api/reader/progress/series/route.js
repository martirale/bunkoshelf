import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { seriesSlug } = body;

    if (!seriesSlug) {
      return NextResponse.json({ error: "Missing seriesSlug" }, { status: 400 });
    }

    const series = await prisma.mangaSeries.findUnique({
      where: { slug: seriesSlug },
      select: {
        id: true,
        volumes: {
          select: { id: true }
        }
      },
    });

    if (!series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    const totalVolumes = series.volumes.length;

    if (totalVolumes === 0) {
      return NextResponse.json({
        readVolumes: 0,
        totalVolumes: 0
      }, { status: 200 });
    }

    const readVolumes = await prisma.userToVolume.count({
      where: {
        userId: user.id,
        volumeId: {
          in: series.volumes.map(v => v.id)
        },
        isRead: true
      }
    });

    return NextResponse.json({
      readVolumes,
      totalVolumes
    });
  } catch (err) {
    console.error("Error fetching series progress:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
