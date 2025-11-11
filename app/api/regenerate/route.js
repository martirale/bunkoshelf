import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";

export async function POST() {
  try {
    await prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany();

      for (const user of users) {
        const newId = createId();

        await tx.$executeRaw`UPDATE User SET id = ${newId} WHERE id = ${user.id}`;
        await tx.$executeRaw`UPDATE UserToSeries SET userId = ${newId} WHERE userId = ${user.id}`;
        await tx.$executeRaw`UPDATE UserToVolume SET userId = ${newId} WHERE userId = ${user.id}`;
        await tx.$executeRaw`UPDATE ReadingChallenge SET userId = ${newId} WHERE userId = ${user.id}`;
        await tx.$executeRaw`UPDATE DailyReadingLog SET userId = ${newId} WHERE userId = ${user.id}`;
        await tx.$executeRaw`UPDATE PushSubscription SET userId = ${newId} WHERE userId = ${user.id}`;
      }

      const series = await tx.mangaSeries.findMany();

      for (const s of series) {
        const newId = createId();

        await tx.$executeRaw`UPDATE MangaSeries SET id = ${newId} WHERE id = ${s.id}`;
        await tx.$executeRaw`UPDATE MangaVolume SET seriesId = ${newId} WHERE seriesId = ${s.id}`;
        await tx.$executeRaw`UPDATE UserToSeries SET seriesId = ${newId} WHERE seriesId = ${s.id}`;
        await tx.$executeRaw`UPDATE SeriesToGenre SET seriesId = ${newId} WHERE seriesId = ${s.id}`;
      }

      const volumes = await tx.mangaVolume.findMany();

      for (const vol of volumes) {
        const newId = createId();

        await tx.$executeRaw`UPDATE MangaVolume SET id = ${newId} WHERE id = ${vol.id}`;
        await tx.$executeRaw`UPDATE UserToVolume SET volumeId = ${newId} WHERE volumeId = ${vol.id}`;
        await tx.$executeRaw`UPDATE VolumeToGenre SET volumeId = ${newId} WHERE volumeId = ${vol.id}`;
        await tx.$executeRaw`UPDATE VolumeToTag SET volumeId = ${newId} WHERE volumeId = ${vol.id}`;
      }

      const genres = await tx.genre.findMany();

      for (const genre of genres) {
        const newId = createId();

        await tx.$executeRaw`UPDATE Genre SET id = ${newId} WHERE id = ${genre.id}`;
        await tx.$executeRaw`UPDATE VolumeToGenre SET genreId = ${newId} WHERE genreId = ${genre.id}`;
        await tx.$executeRaw`UPDATE SeriesToGenre SET genreId = ${newId} WHERE genreId = ${genre.id}`;
      }

      const tags = await tx.tag.findMany();

      for (const tag of tags) {
        const newId = createId();

        await tx.$executeRaw`UPDATE Tag SET id = ${newId} WHERE id = ${tag.id}`;
        await tx.$executeRaw`UPDATE VolumeToTag SET tagId = ${newId} WHERE tagId = ${tag.id}`;
      }

      const volumeToGenres = await tx.volumeToGenre.findMany();

      for (const rel of volumeToGenres) {
        const newId = createId();
        await tx.$executeRaw`UPDATE VolumeToGenre SET id = ${newId} WHERE id = ${rel.id}`;
      }

      const volumeToTags = await tx.volumeToTag.findMany();

      for (const rel of volumeToTags) {
        const newId = createId();
        await tx.$executeRaw`UPDATE VolumeToTag SET id = ${newId} WHERE id = ${rel.id}`;
      }

      const seriesToGenres = await tx.seriesToGenre.findMany();

      for (const rel of seriesToGenres) {
        const newId = createId();
        await tx.$executeRaw`UPDATE SeriesToGenre SET id = ${newId} WHERE id = ${rel.id}`;
      }

      const userToSeries = await tx.userToSeries.findMany();

      for (const rel of userToSeries) {
        const newId = createId();
        await tx.$executeRaw`UPDATE UserToSeries SET id = ${newId} WHERE id = ${rel.id}`;
      }

      const userToVolumes = await tx.userToVolume.findMany();

      for (const rel of userToVolumes) {
        const newId = createId();
        await tx.$executeRaw`UPDATE UserToVolume SET id = ${newId} WHERE id = ${rel.id}`;
      }

      const challenges = await tx.readingChallenge.findMany();

      for (const challenge of challenges) {
        const newId = createId();
        await tx.$executeRaw`UPDATE ReadingChallenge SET id = ${newId} WHERE id = ${challenge.id}`;
      }

      const logs = await tx.dailyReadingLog.findMany();

      for (const log of logs) {
        const newId = createId();
        await tx.$executeRaw`UPDATE DailyReadingLog SET id = ${newId} WHERE id = ${log.id}`;
      }

      const subscriptions = await tx.pushSubscription.findMany();

      for (const sub of subscriptions) {
        const newId = createId();
        await tx.$executeRaw`UPDATE PushSubscription SET id = ${newId} WHERE id = ${sub.id}`;
      }

      const volumeMetadata = await tx.volumeMetadata.findMany();

      for (const meta of volumeMetadata) {
        const newId = createId();
        await tx.$executeRaw`UPDATE VolumeMetadata SET id = ${newId} WHERE id = ${meta.id}`;
      }

      const seriesMetadata = await tx.seriesMetadata.findMany();

      for (const meta of seriesMetadata) {
        const newId = createId();
        await tx.$executeRaw`UPDATE SeriesMetadata SET id = ${newId} WHERE id = ${meta.id}`;
      }
    });

    return NextResponse.json({
      success: true,
      message: "IDs regenerated successfully",
    });
  } finally {
    await prisma.$disconnect();
  }
}
