import MangaCard from "@/components/ui/MangaCard";
import { verifySession } from "@/lib/auth/verifySession";
import {
  listFavoriteSeriesIds,
  listSeriesWithVolumes,
} from "@/lib/db/library";
import { GhostIcon, LibraryBigIcon } from "lucide-react";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import {
  getLibrarySeriesHref,
  getLibraryVolumeHref,
  type LibraryScope,
  type LibrarySection,
} from "@/lib/librarySection";
import { sortByPaddedTitle } from "@/lib/utils";
import { getSeriesBulkProgress } from "@/lib/reader/readingProgress";
import type { Locale, Dictionary } from "@/lib/types";

interface SeriesIndexFavProps {
  lang: Locale;
  intl: Dictionary;
  scope?: LibraryScope;
  section?: LibrarySection;
}

export default async function SeriesIndexFav({
  lang,
  intl,
  scope = "all",
  section = "manga",
}: SeriesIndexFavProps) {
  const user = await verifySession();
  if (!user) return null;

  const favoriteSeriesIds = await listFavoriteSeriesIds(user.id);

  if (favoriteSeriesIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <GhostIcon size={64} />
        <h2>{intl.misc.noSeriesFav as string}</h2>
      </div>
    );
  }

  const favorites = await listSeriesWithVolumes({
    seriesIds: favoriteSeriesIds,
    scope,
  });

  const entries = favorites.map((series) => {
    const sortedVolumes = sortByPaddedTitle(series.volumes);

    return {
      ...series,
      coverImage:
        sortedVolumes.length > 0
          ? getMangaCoverUrl(sortedVolumes[0])
          : null,
      volumes:
        sortedVolumes.map((vol) => ({
          ...vol,
          coverImage: getMangaCoverUrl(vol),
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
        {intl.favorites.ttSeries as string}
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
            ? getLibrarySeriesHref(lang, section, entry.slug)
            : getLibraryVolumeHref(lang, section, entry.volumes[0]?.slug ?? "");

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
              isDragging={false}
              seriesSlug={entry.slug}
              intl={intl}
              className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
            />
          );
        })}
      </div>
    </>
  );
}
