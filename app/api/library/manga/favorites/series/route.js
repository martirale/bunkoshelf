import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const user = await verifySession();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();
    const { seriesId, favorite } = body;

    if (typeof seriesId !== "number" || typeof favorite !== "boolean") {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
      });
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

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error updating favorite:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
