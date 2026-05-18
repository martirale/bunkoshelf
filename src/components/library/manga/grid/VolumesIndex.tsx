import { listVolumes } from "@/lib/db/library";
import { sortByPaddedTitle } from "@/lib/utils";
import { LibraryBigIcon } from "lucide-react";
import MangaCard from "@/components/ui/MangaCard";
import Pagination from "@/components/ui/Pagination";
import FiltersDrawer from "@/components/library/manga/FiltersDrawer";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import {
  getLibraryVolumeHref,
  type LibraryScope,
  type LibrarySection,
} from "@/lib/librarySection";
import type { Locale, Dictionary } from "@/lib/types";

const PAGE_SIZE = 35;

interface VolumesIndexProps {
  lang: Locale;
  intl: Dictionary;
  page?: number;
  genreFilter?: string | string[];
  tagFilter?: string | string[];
  scope?: LibraryScope;
  section?: LibrarySection;
}

export default async function VolumesIndex({
  lang,
  intl,
  page = 1,
  genreFilter = [],
  tagFilter = [],
  scope = "all",
  section = "manga",
}: VolumesIndexProps) {
  const genreList =
    typeof genreFilter === "string" ? genreFilter.split(",") : genreFilter;
  const tagList =
    typeof tagFilter === "string" ? tagFilter.split(",") : tagFilter;

  const volumes = await listVolumes({
    includeGenres: true,
    includeTags: true,
    genreNames: genreList,
    tagNames: tagList,
    scope,
  });

  const sortedVolumes = sortByPaddedTitle(volumes);
  const entries = sortedVolumes.map((vol) => ({
    ...vol,
    isOneshot: vol.series?.isOneshot === true,
    coverImage: getMangaCoverUrl(vol),
    meta: vol.metadataObj || null,
    genres: vol.genres.map((genre) => genre.name),
    tags: vol.tags.map((tag) => tag.name),
  }));

  const total = entries.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const paginatedEntries = entries.slice(start, start + PAGE_SIZE);

  return (
    <>
      <div className="flex items-center mb-4">
        <h2 className="flex items-center text-base md:text-lg mr-4">
          <LibraryBigIcon size={28} className="mr-2" />
          {intl.manga.allVolumes as string}
        </h2>

        <FiltersDrawer intl={intl} />
      </div>

      <section className="grid grid-cols-2 md:grid-cols-5 2xl:grid-cols-7 gap-4">
        {paginatedEntries.map((entry) => {
          const href = getLibraryVolumeHref(lang, section, entry.slug);

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
              cover={entry.coverImage}
              isDragging={false}
              seriesSlug={null}
              progressRatio={null}
              intl={intl}
              className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
            />
          );
        })}
      </section>

      {total > PAGE_SIZE && (
        <div className="mt-8">
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
