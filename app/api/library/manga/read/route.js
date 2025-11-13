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
    const read = body.read === true || body.read === "true";
    const totalPages =
      body.totalPages !== undefined && body.totalPages !== null
        ? Number(body.totalPages)
        : undefined;
    const lastReadAt = body.lastReadAt;
    const firstRead = body.firstRead;

    if (
      typeof volumeId !== "string" ||
      !volumeId ||
      typeof read !== "boolean" ||
      (read && !Number.isInteger(totalPages))
    ) {
      response = new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
      });
      return response;
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

    response = new Response(JSON.stringify({ success: true }), { status: 200 });
    return response;
  } catch (e) {
    error = e;
  } finally {
    if (error) {
      console.error("Error updating read state:", error);
      return new Response(JSON.stringify({ error: "Server error" }), {
        status: 500,
      });
    }
  }
}
