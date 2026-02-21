import prisma from "@/lib/prisma";

export async function getSeriesBulkProgress(userId, seriesIds) {
  if (!userId || !seriesIds?.length) return {};

  const records = await prisma.userToVolume.findMany({
    where: {
      userId,
      isRead: true,
      volume: { seriesId: { in: seriesIds } },
    },
    select: { volume: { select: { seriesId: true } } },
  });

  return records.reduce((acc, { volume }) => {
    acc[volume.seriesId] = (acc[volume.seriesId] || 0) + 1;
    return acc;
  }, {});
}
