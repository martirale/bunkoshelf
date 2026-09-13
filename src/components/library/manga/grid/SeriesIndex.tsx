import { listPagedSeriesWithVolumes } from "@/lib/db/library";
import { sortByPaddedTitle } from "@/lib/utils";
import { LibraryBigIcon } from "lucide-react";
import MangaCard from "@/components/ui/MangaCard";
import Pagination from "@/components/ui/Pagination";
import FiltersDrawer from "@/components/library/manga/FiltersDrawer";
import { verifySession } from "@/lib/auth/verifySession";
import { LIBRARY_PAGE_SIZE } from "@/lib/libraryPagination";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import {
  getLibrarySeriesHref,
  getLibraryVolumeHref,
  type LibraryScope,
  type LibrarySection,
} from "@/lib/librarySection";
import { getSeriesBulkProgress } from "@/lib/reader/readingProgress";
import type { Locale, Dictionary } from "@/lib/types";

interface SeriesIndexProps {
  lang: Locale;
  intl: Dictionary;
  page?: number;
  authorFilter?: string | string[];
  genreFilter?: string | string[];
  tagFilter?: string | string[];
  scope?: LibraryScope;
  section?: LibrarySection;
  includeOneshots?: boolean;
}

export default async function SeriesIndex({
  lang,
  intl,
  page = 1,
  authorFilter = [],
  genreFilter = [],
  tagFilter = [],
  scope = "all",
  section = "manga",
  includeOneshots = false,
}: SeriesIndexProps) {
  const authorList =
    typeof authorFilter === "string" ? authorFilter.split(",") : authorFilter;
  const genreList =
    typeof genreFilter === "string" ? genreFilter.split(",") : genreFilter;
  const tagList =
    typeof tagFilter === "string" ? tagFilter.split(",") : tagFilter;

  const [user, paginated] = await Promise.all([
    verifySession(),
    listPagedSeriesWithVolumes({
      page,
      pageSize: LIBRARY_PAGE_SIZE,
      authorNames: authorList,
      genreNames: genreList,
      tagNames: tagList,
      includeGenres: true,
      includeTags: true,
      scope,
      excludeOneshots: !includeOneshots,
    }),
  ]);

  const entries = paginated.items.map((entry) => {
    const sortedVolumes = sortByPaddedTitle(entry.volumes);

    return {
      ...entry,
      coverImage:
        sortedVolumes.length > 0
          ? getMangaCoverUrl(sortedVolumes[0])
          : null,
      volumes: sortedVolumes.map((vol) => ({
        ...vol,
        coverImage: getMangaCoverUrl(vol),
        meta: vol.metadataObj || null,
        genres: vol.genres.map((genre) => genre.name),
        tags: vol.tags.map((tag) => tag.name),
      })),
    };
  });

  const readCountMap = await getSeriesBulkProgress(
    user?.id ?? null,
    entries.map((e) => e.id)
  );

  return (
    <>
      <div className="flex items-center mb-4">
        <h2 className="flex items-center text-base md:text-lg mr-4">
          <LibraryBigIcon size={28} className="mr-2" />
          {section === "others"
            ? (intl.libraries.allOtherCollections as string)
            : (intl.manga.allSeries as string)}
        </h2>

        <FiltersDrawer intl={intl} scope={scope} />
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-7">
        {entries.map((entry) => {
          const totalVolumes = entry.volumes.length;
          const readVolumes = readCountMap[entry.id] ?? 0;
          const progressRatio = totalVolumes > 0 ? readVolumes / totalVolumes : 0;
          const firstVolume = entry.volumes[0];
          const isOneshot = entry.isOneshot;

          return (
            <MangaCard
              key={entry.title}
              title={
                isOneshot
                  ? firstVolume?.meta?.title ?? firstVolume?.title ?? entry.title
                  : firstVolume?.meta?.series ?? firstVolume?.title ?? entry.title
              }
              href={
                isOneshot && firstVolume
                  ? getLibraryVolumeHref(lang, section, firstVolume.slug)
                  : getLibrarySeriesHref(lang, section, entry.slug)
              }
              isSeries={!isOneshot}
              isOneshot={isOneshot}
              onGoing={!isOneshot && entry.status === "ONGOING"}
              onPause={!isOneshot && entry.status === "HIATUS"}
              volumeCount={isOneshot ? null : totalVolumes}
              countLabel={section === "others" ? intl.libraries.otherWorks as string : undefined}
              cover={entry.coverImage}
              progressRatio={progressRatio}
              isDragging={false}
              seriesSlug={isOneshot ? null : entry.slug}
              offlineVolumeId={isOneshot ? firstVolume?.id : null}
              offlineSeriesId={isOneshot ? null : entry.id}
              intl={intl}
              className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
            />
          );
        })}
      </section>

      {paginated.total > LIBRARY_PAGE_SIZE && (
        <div className="mt-12">
          <Pagination
            currentPage={page}
            totalPages={paginated.totalPages}
            intl={intl}
          />
        </div>
      )}
    </>
  );
}
