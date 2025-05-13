import MangaCard from "./MangaCard";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";
import { Ghost } from "lucide-react";

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
          volumes: true,
        },
      },
    },
  });

  const entries = favorites.map(({ series }) => ({
    ...series,
    coverImage: series.volumes?.[0]?.coverImage?.replace(/\\/g, "/") ?? null,
    volumes:
      series.volumes?.map((vol) => ({
        ...vol,
        coverImage: vol.coverImage?.replace(/\\/g, "/") ?? null,
      })) ?? [],
  }));

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
      <h2 className="mt-8 mb-4 py-4">Series: Manga</h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
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
              title={entry.title}
              href={href}
              isSeries={isSeries}
              isOneshot={isOneshot}
              volumeCount={isSeries ? entry.volumes.length : null}
              cover={coverImage}
              intl={intl}
              className="text-xs leading-6 2xl:text-sm 2xl:leading-6.5"
            />
          );
        })}
      </div>
    </>
  );
}
