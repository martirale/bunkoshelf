import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function POST(req) {
  let response;
  let error;
  try {
    const user = await verifySession();
    if (!user) {
      response = new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
      return response;
    }

    const body = await req.json();
    const seriesId =
      typeof body.seriesId === "string"
        ? body.seriesId
        : body.seriesId == null
        ? ""
        : String(body.seriesId);
    const favorite = body.favorite === true || body.favorite === "true";

    if (
      typeof seriesId !== "string" ||
      !seriesId ||
      typeof favorite !== "boolean"
    ) {
      response = new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
      });
      return response;
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

    response = new Response(JSON.stringify({ success: true }), { status: 200 });
    return response;
  } catch (e) {
    error = e;
  } finally {
    if (error) {
      console.error("Error updating favorite (series):", error);
      return new Response(JSON.stringify({ error: "Server error" }), {
        status: 500,
      });
    }
  }
}
