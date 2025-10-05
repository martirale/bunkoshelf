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
    const { volumeId, read, totalPages, lastReadAt, firstRead } = body;

    if (
      typeof volumeId !== "number" ||
      typeof read !== "boolean" ||
      (read && typeof totalPages !== "number")
    ) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
      });
    }

    const existing = await prisma.userToVolume.findUnique({
      where: {
        userId_volumeId: {
          userId: user.id,
          volumeId,
        },
      },
      select: {
        firstRead: true,
      },
    });

    const updatePayload = {
      isRead: read,
      lastPage: read ? totalPages - 1 : 0,
      totalPages,
      lastReadAt: read ? new Date(lastReadAt || Date.now()) : null,
    };

    // Solo setear firstRead si está marcando como leído y no hay un valor previo
    if (read && !existing?.firstRead && typeof firstRead === "string") {
      updatePayload.firstRead = firstRead;
    }

    await prisma.userToVolume.upsert({
      where: {
        userId_volumeId: {
          userId: user.id,
          volumeId,
        },
      },
      update: updatePayload,
      create: {
        userId: user.id,
        volumeId,
        ...updatePayload,
        firstRead: read ? firstRead ?? null : null,
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating read state:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
