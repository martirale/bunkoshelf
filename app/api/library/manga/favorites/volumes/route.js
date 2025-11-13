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
    const volumeId =
      typeof body.volumeId === "string"
        ? body.volumeId
        : body.volumeId == null
        ? ""
        : String(body.volumeId);
    const favorite = body.favorite === true || body.favorite === "true";

    if (
      typeof volumeId !== "string" ||
      !volumeId ||
      typeof favorite !== "boolean"
    ) {
      response = new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
      });
      return response;
    }

    await prisma.userToVolume.upsert({
      where: {
        userId_volumeId: {
          userId: user.id,
          volumeId: volumeId,
        },
      },
      update: {
        isFavorite: favorite,
      },
      create: {
        userId: user.id,
        volumeId: volumeId,
        isFavorite: favorite,
      },
    });

    response = new Response(JSON.stringify({ success: true }), { status: 200 });
    return response;
  } catch (e) {
    error = e;
  } finally {
    if (error) {
      console.error("Error updating favorite (volume):", error);
      return new Response(JSON.stringify({ error: "Server error" }), {
        status: 500,
      });
    }
  }
}
