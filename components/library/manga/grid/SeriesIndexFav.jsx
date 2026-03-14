import MangaCard from "@/components/ui/MangaCard";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";
import { GhostIcon, LibraryBigIcon } from "lucide-react";
import { sortByPaddedTitle } from "@/lib/utils";
import { getSeriesBulkProgress } from "@/lib/reader/readingProgress";

export default async function SeriesIndexFav({ lang, intl }) {
  const user = await verifySession();
  if (!user) return null;

  const favorites = await prisma.userToSeries.findMany({
    where: {
      userId: user.id,
      isFavorite: true,
    },
    include: {
      series: {
        include: {
          volumes: {
            include: {
              metadataObj: true,
            },
          },
        },
      },
    },
    orderBy: {
      series: {
        title: "asc",
      },
    },
  });

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <GhostIcon size={64} />
        <h2>{intl.misc.noSeriesFav}</h2>
      </div>
    );
  }

  const entries = favorites.map(({ series }) => {
    const sortedVolumes = sortByPaddedTitle(series.volumes);

    return {
      ...series,
      coverImage:
        sortedVolumes.length > 0
          ? `/api/library/manga/cover/${sortedVolumes[sortedVolumes.length - 1].slug}`
          : null,
      volumes:
        sortedVolumes.map((vol) => ({
          ...vol,
          coverImage: vol.coverImage
            ? `/api/library/manga/cover/${vol.slug}`
            : null,
          meta: vol.metadataObj || null,
        })) ?? [],
    };
  });

  const readCountMap = await getSeriesBulkProgress(
    user.id,
    entries.map((e) => e.id)
  );

  return (
    <>
      <h2 className="flex items-center mb-4">
        <LibraryBigIcon size={28} className="mr-2" />
        {intl.favorites.ttSeries}
      </h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {entries.map((entry) => {
          const isSeries = !entry.isOneshot;
          const totalVolumes = entry.volumes.length;
          const readVolumes = readCountMap[entry.id] ?? 0;
          const progressRatio = isSeries && totalVolumes > 0
            ? readVolumes / totalVolumes
            : 0;

          const href = isSeries
            ? `/${lang}/manga/${entry.slug}`
            : `/${lang}/manga/volume/${entry.volumes[0]?.slug}`;

          return (
            <MangaCard
              key={entry.title}
              title={entry.volumes?.[0]?.meta?.series ?? entry.title}
              href={href}
              isSeries={isSeries}
              isOneshot={!isSeries}
              onGoing={entry.status === "ONGOING"}
              onPause={entry.status === "HIATUS"}
              volumeCount={isSeries ? totalVolumes : null}
              cover={entry.coverImage}
              progressRatio={progressRatio}
              intl={intl}
              className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
            />
          );
        })}
      </div>
    </>
  );
}
