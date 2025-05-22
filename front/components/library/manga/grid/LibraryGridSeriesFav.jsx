import MangaCard from "@/ui/library/manga/MangaCard";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";
import { Ghost } from "lucide-react";
import { sortByPaddedTitle } from "@/lib/utils";

export default async function LibraryGridSeriesFav({ lang, intl }) {
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

  const entries = favorites.map(({ series }) => {
    const sortedVolumes = sortByPaddedTitle(series.volumes);

    return {
      ...series,
      coverImage:
        sortedVolumes.length > 0
          ? sortedVolumes[sortedVolumes.length - 1].coverImage?.replace(
              /\\/g,
              "/"
            ) ?? null
          : null,
      volumes:
        sortedVolumes.map((vol) => ({
          ...vol,
          coverImage: vol.coverImage
            ? `/api/library/manga/cover${vol.coverImage
                .replace(/\\/g, "/")
                .replace(/^\/?covers/, "")}`
            : null,
          meta: vol.metadataObj || null,
        })) ?? [],
    };
  });

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Ghost className="w-16 h-16" />
        <h2>{intl.misc.noSeriesFav}</h2>
      </div>
    );
  }

  return (
    <>
      <h2 className="mt-8 mb-4 pt-4">Series: Manga</h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-7">
        {entries.map((entry) => {
          const isSeries =
            (entry.volumes && entry.volumes.length > 1) || entry.metadata;
          const isOneshot = !isSeries;

          const href = isOneshot
            ? `/${lang}/manga/volume/${entry.volumeSlug}`
            : `/${lang}/manga/${entry.slug}`;

          const coverImage = entry.coverImage;

          return (
            <MangaCard
              key={entry.title}
              title={entry.volumes?.[0]?.meta?.series ?? entry.title}
              href={href}
              isSeries={isSeries}
              isOneshot={isOneshot}
              volumeCount={isSeries ? entry.volumes.length : null}
              cover={coverImage}
              intl={intl}
              className="font-roboto font-bold leading-5 2xl:leading-6 text-base 2xl:text-xl"
            />
          );
        })}
      </div>
    </>
  );
}
