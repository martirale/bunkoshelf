import { listSeriesWithVolumes } from "@/lib/db/library";
import { sortByPaddedTitle } from "@/lib/utils";
import { LibraryBigIcon } from "lucide-react";
import MangaCard from "@/components/ui/MangaCard";
import Pagination from "@/components/ui/Pagination";
import FiltersDrawer from "@/components/library/manga/FiltersDrawer";
import { verifySession } from "@/lib/auth/verifySession";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import {
  getLibrarySeriesHref,
  type LibraryScope,
  type LibrarySection,
} from "@/lib/librarySection";
import { getSeriesBulkProgress } from "@/lib/reader/readingProgress";
import type { Locale, Dictionary } from "@/lib/types";

const PAGE_SIZE = 35;

interface SeriesIndexProps {
  lang: Locale;
  intl: Dictionary;
  page?: number;
  genreFilter?: string | string[];
  tagFilter?: string | string[];
  scope?: LibraryScope;
  section?: LibrarySection;
}

export default async function SeriesIndex({
  lang,
  intl,
  page = 1,
  genreFilter = [],
  tagFilter = [],
  scope = "all",
  section = "manga",
}: SeriesIndexProps) {
  const genreList =
    typeof genreFilter === "string" ? genreFilter.split(",") : genreFilter;
  const tagList =
    typeof tagFilter === "string" ? tagFilter.split(",") : tagFilter;

  const [user, series] = await Promise.all([
    verifySession(),
    listSeriesWithVolumes({
      genreNames: genreList,
      tagNames: tagList,
      includeGenres: true,
      includeTags: true,
      scope,
    }),
  ]);

  const entries = series.filter((entry) => !entry.isOneshot).map((entry) => {
    const sortedVolumes = sortByPaddedTitle(entry.volumes);

    return {
      ...entry,
      coverImage:
        sortedVolumes.length > 0
          ? getMangaCoverUrl(sortedVolumes[sortedVolumes.length - 1])
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

  const total = entries.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const paginatedEntries = entries.slice(start, start + PAGE_SIZE);

  const readCountMap = await getSeriesBulkProgress(
    user?.id ?? null,
    paginatedEntries.map((e) => e.id)
  );

  return (
    <>
      <div className="flex items-center mb-4">
        <h2 className="flex items-center text-base md:text-lg mr-4">
          <LibraryBigIcon size={28} className="mr-2" />
          {intl.manga.allSeries as string}
        </h2>

        <FiltersDrawer intl={intl} />
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-7">
        {paginatedEntries.map((entry) => {
          const totalVolumes = entry.volumes.length;
          const readVolumes = readCountMap[entry.id] ?? 0;
          const progressRatio = totalVolumes > 0 ? readVolumes / totalVolumes : 0;

          return (
            <MangaCard
              key={entry.title}
              title={entry.volumes?.[0]?.meta?.series ?? entry.title}
              href={getLibrarySeriesHref(lang, section, entry.slug)}
              isSeries={true}
              isOneshot={false}
              onGoing={entry.status === "ONGOING"}
              onPause={entry.status === "HIATUS"}
              volumeCount={totalVolumes}
              cover={entry.coverImage}
              progressRatio={progressRatio}
              isDragging={false}
              seriesSlug={entry.slug}
              intl={intl}
              className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
            />
          );
        })}
      </section>

      {total > PAGE_SIZE && (
        <div className="mt-12">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            intl={intl}
          />
        </div>
      )}
    </>
  );
}
