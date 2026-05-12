import MangaCard from "@/components/ui/MangaCard";
import { verifySession } from "@/lib/auth/verifySession";
import { listFavoriteVolumeIds, listVolumes } from "@/lib/db/library";
import { sortByPaddedTitle } from "@/lib/utils";
import { GhostIcon, BookCopyIcon } from "lucide-react";
import type { Locale, Dictionary } from "@/lib/types";

interface VolumesIndexFavProps {
  lang: Locale;
  intl: Dictionary;
}

export default async function VolumesIndexFav({ lang, intl }: VolumesIndexFavProps) {
  const user = await verifySession();
  if (!user) return null;

  const favoriteVolumeIds = await listFavoriteVolumeIds(user.id);
  if (favoriteVolumeIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <GhostIcon size={64} />
        <h2>{intl.misc.noVolumesFav as string}</h2>
      </div>
    );
  }

  const volumes = await listVolumes({
    volumeIds: favoriteVolumeIds,
  });
  const sortedVolumes = sortByPaddedTitle(volumes);
  const entries = sortedVolumes.map((vol) => ({
    ...vol,
    isOneshot: vol.series?.isOneshot === true,
    coverImage: vol.coverImage
      ? `/api/library/manga/cover/${vol.slug}/${vol.coverImage}`
      : null,
    meta: vol.metadataObj || null,
  }));

  return (
    <>
      <h2 className="flex items-center mt-8 mb-4">
        <BookCopyIcon size={28} className="mr-2" />
        {intl.favorites.ttVolumes as string}
      </h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {entries.map((entry) => {
          const href = `/${lang}/manga/volume/${entry.slug}`;
          const coverImage = entry.coverImage;

          return (
            <MangaCard
              key={entry.title}
              title={entry.meta?.title}
              href={href}
              isSeries={false}
              isOneshot={entry.isOneshot}
              onGoing={false}
              onPause={false}
              volumeCount={null}
              cover={coverImage}
              progressRatio={null}
              isDragging={false}
              seriesSlug={null}
              intl={intl}
              className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
            />
          );
        })}
      </div>
    </>
  );
}
