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
    const { volumeId, read, totalPages } = body;

    if (
      typeof volumeId !== "number" ||
      typeof read !== "boolean" ||
      (read && typeof totalPages !== "number")
    ) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
      });
    }

    await prisma.userToVolume.upsert({
      where: {
        userId_volumeId: {
          userId: user.id,
          volumeId: volumeId,
        },
      },
      update: {
        isRead: read,
        lastPage: read ? totalPages - 1 : 0,
        totalPages,
        lastReadAt: read ? new Date(body.lastReadAt || Date.now()) : null,
      },
      create: {
        userId: user.id,
        volumeId: volumeId,
        isRead: read,
        lastPage: read ? totalPages - 1 : 0,
        totalPages,
        lastReadAt: read ? new Date(body.lastReadAt || Date.now()) : null,
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
