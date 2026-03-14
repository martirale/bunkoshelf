"use server";

import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function updateReadState({
  volumeId,
  read,
  totalPages,
  lastReadAt,
  firstRead,
}) {
  let error;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    const normalizedVolumeId =
      typeof volumeId === "string"
        ? volumeId
        : volumeId == null
        ? ""
        : String(volumeId);
    const normalizedRead = read === true || String(read) === "true";
    const normalizedTotalPages =
      totalPages !== undefined && totalPages !== null
        ? Number(totalPages)
        : undefined;

    if (
      typeof normalizedVolumeId !== "string" ||
      !normalizedVolumeId ||
      typeof normalizedRead !== "boolean" ||
      (normalizedRead && !Number.isInteger(normalizedTotalPages))
    ) {
      return { error: "Invalid payload", status: 400 };
    }

    const existing = await prisma.userToVolume.findUnique({
      where: {
        userId_volumeId: {
          userId: user.id,
          volumeId: normalizedVolumeId,
        },
      },
      select: {
        firstRead: true,
      },
    });

    const updatePayload = {
      isRead: normalizedRead,
      lastPage: normalizedRead ? normalizedTotalPages - 1 : 0,
      totalPages: normalizedTotalPages,
      lastReadAt: normalizedRead ? new Date(lastReadAt || Date.now()) : null,
    };

    if (
      normalizedRead &&
      !existing?.firstRead &&
      typeof firstRead === "string"
    ) {
      updatePayload.firstRead = firstRead;
    }

    await prisma.userToVolume.upsert({
      where: {
        userId_volumeId: {
          userId: user.id,
          volumeId: normalizedVolumeId,
        },
      },
      update: updatePayload,
      create: {
        userId: user.id,
        volumeId: normalizedVolumeId,
        ...updatePayload,
        firstRead: normalizedRead ? firstRead ?? null : null,
      },
    });

    if (normalizedRead && typeof firstRead === "string") {
      await prisma.readingEntry.create({
        data: {
          userId: user.id,
          volumeId: normalizedVolumeId,
          readAt: firstRead,
        },
      });
    }

    return { success: true, status: 200 };
  } catch (e) {
    error = e;
  } finally {
    if (error) {
      console.error("Error updating read state:", error);
      return { error: "Server error", status: 500 };
    }
  }
}
