"use server";

import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function syncFirstRead(userId: string, volumeId: string) {
  const oldest = await prisma.readingEntry.findFirst({
    where: { userId, volumeId },
    orderBy: { readAt: "asc" },
    select: { readAt: true },
  });

  const hasEntries = !!oldest;

  let progressUpdate: { lastPage?: number; totalPages?: number } = {};

  if (hasEntries) {
    const existing = await prisma.userToVolume.findUnique({
      where: { userId_volumeId: { userId, volumeId } },
      select: { totalPages: true },
    });

    let totalPages = existing?.totalPages;

    if (!totalPages) {
      const volume = await prisma.mangaVolume.findUnique({
        where: { id: volumeId },
        select: { metadataObj: { select: { pageCount: true } } },
      });
      totalPages = volume?.metadataObj?.pageCount ?? undefined;
    }

    if (totalPages) {
      progressUpdate = { lastPage: totalPages - 1, totalPages };
    }
  } else {
    progressUpdate = { lastPage: 0 };
  }

  await prisma.userToVolume.upsert({
    where: { userId_volumeId: { userId, volumeId } },
    update: {
      firstRead: oldest?.readAt ?? null,
      isRead: hasEntries,
      ...progressUpdate,
    },
    create: {
      userId,
      volumeId,
      firstRead: oldest?.readAt ?? null,
      isRead: hasEntries,
      ...progressUpdate,
    },
  });
}

export async function getReadingHistory({ volumeId }: { volumeId: string }) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const entries = await prisma.readingEntry.findMany({
    where: {
      userId: user.id,
      volumeId,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      readAt: true,
    },
  });

  return { entries };
}

export async function createReadingEntry({ volumeId, readAt }: { volumeId: string; readAt: string }) {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!volumeId || !readAt) {
      return { error: "Missing fields", status: 400 };
    }

    const entry = await prisma.readingEntry.create({
      data: {
        userId: user.id,
        volumeId,
        readAt,
      },
      select: { id: true, readAt: true },
    });

    await syncFirstRead(user.id, volumeId);

    return { success: true, entry };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error creating reading entry:", error);
      return { error: "Server error", status: 500 };
    }
  }
}

export async function updateReadingEntry({ entryId, readAt }: { entryId: string; readAt: string }) {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!entryId || !readAt) {
      return { error: "Missing fields", status: 400 };
    }

    const existing = await prisma.readingEntry.findUnique({
      where: { id: entryId },
      select: { userId: true, volumeId: true },
    });

    if (!existing || existing.userId !== user.id) {
      return { error: "Not found", status: 404 };
    }

    const entry = await prisma.readingEntry.update({
      where: { id: entryId },
      data: { readAt },
      select: { id: true, readAt: true },
    });

    await syncFirstRead(user.id, existing.volumeId);

    return { success: true, entry };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error updating reading entry:", error);
      return { error: "Server error", status: 500 };
    }
  }
}

export async function deleteReadingEntry({ entryId }: { entryId: string }) {
  let error: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!entryId) {
      return { error: "Missing fields", status: 400 };
    }

    const existing = await prisma.readingEntry.findUnique({
      where: { id: entryId },
      select: { userId: true, volumeId: true },
    });

    if (!existing || existing.userId !== user.id) {
      return { error: "Not found", status: 404 };
    }

    await prisma.readingEntry.delete({
      where: { id: entryId },
    });

    await syncFirstRead(user.id, existing.volumeId);

    return { success: true };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error deleting reading entry:", error);
      return { error: "Server error", status: 500 };
    }
  }
}
