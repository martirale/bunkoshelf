import MangaCard from "@/components/ui/MangaCard";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";
import { sortByPaddedTitle } from "@/lib/utils";
import { Ghost } from "lucide-react";

export default async function VolumesIndexFav({ lang, intl }) {
  const user = await verifySession();
  if (!user) return null;

  const favorites = await prisma.userToVolume.findMany({
    where: {
      userId: user.id,
      isFavorite: true,
    },
    include: {
      volume: {
        include: {
          series: true,
          metadataObj: true,
        },
      },
    },
    orderBy: {
      volume: {
        title: "asc",
      },
    },
  });

  const volumes = favorites.map(({ volume }) => volume);
  const sortedVolumes = sortByPaddedTitle(volumes);
  const entries = sortedVolumes.map((vol) => ({
    ...vol,
    isOneshot: vol.series?.isOneshot === true,
    coverImage: vol.coverImage
      ? `/api/library/manga/cover${vol.coverImage
          .replace(/\\/g, "/")
          .replace(/^\/?covers/, "")}`
      : null,
    meta: vol.metadataObj || null,
  }));

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Ghost className="w-16 h-16" />
        <h2>{intl.misc.noVolumesFav}</h2>
      </div>
    );
  }

  return (
    <>
      <h2 className="mt-8 mb-4 pt-4">Volúmenes</h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-7">
        {entries.map((entry) => {
          const href = `/${lang}/manga/volume/${entry.slug}`;
          const coverImage = entry.coverImage;

          return (
            <MangaCard
              key={entry.title}
              title={entry.meta.title}
              href={href}
              isSeries={false}
              isOneshot={entry.isOneshot}
              volumeCount={null}
              cover={coverImage}
              intl={intl}
              className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
            />
          );
        })}
      </div>
    </>
  );
}
