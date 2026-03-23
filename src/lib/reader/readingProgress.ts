import prisma from "@/lib/prisma";

export async function getSeriesBulkProgress(
  userId: string | null,
  seriesIds: string[]
): Promise<Record<string, number>> {
  if (!userId || !seriesIds?.length) return {};

  const records = await prisma.userToVolume.findMany({
    where: {
      userId,
      isRead: true,
      volume: { seriesId: { in: seriesIds } },
    },
    select: { volume: { select: { seriesId: true } } },
  });

  return records.reduce<Record<string, number>>((acc, { volume }) => {
    acc[volume.seriesId] = (acc[volume.seriesId] || 0) + 1;
    return acc;
  }, {});
}
