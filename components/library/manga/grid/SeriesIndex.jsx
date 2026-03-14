import React from "react";
import prisma from "@/lib/prisma";
import { sortByPaddedTitle } from "@/lib/utils";
import { LibraryBigIcon } from "lucide-react";
import MangaCard from "@/components/ui/MangaCard";
import Pagination from "@/components/ui/Pagination";
import FiltersDrawer from "@/components/library/manga/FiltersDrawer";
import { verifySession } from "@/lib/auth/verifySession";
import { getSeriesBulkProgress } from "@/lib/reader/readingProgress";

const PAGE_SIZE = 35;

export default async function SeriesIndex({
  lang,
  intl,
  page = 1,
  genreFilter = [],
  tagFilter = [],
}) {
  const genreList =
    typeof genreFilter === "string" ? genreFilter.split(",") : genreFilter;
  const tagList =
    typeof tagFilter === "string" ? tagFilter.split(",") : tagFilter;

  const genreConditions =
    Array.isArray(genreList) && genreList.length > 0
      ? genreList.map((genre) => ({
          genres: {
            some: {
              genre: {
                name: genre,
              },
            },
          },
        }))
      : [];

  const tagConditions =
    Array.isArray(tagList) && tagList.length > 0
      ? tagList.map((tag) => ({
          tags: {
            some: {
              tag: {
                name: tag,
              },
            },
          },
        }))
      : [];

  const volumeConditions = [...genreConditions, ...tagConditions];

  const where = {
    isOneshot: false,
    ...(volumeConditions.length
      ? {
          volumes: {
            some: {
              AND: volumeConditions,
            },
          },
        }
      : {}),
  };

  const [user, series] = await Promise.all([
    verifySession(),
    prisma.mangaSeries.findMany({
      where,
      include: {
        volumes: {
          include: {
            metadataObj: true,
            genres: {
              include: { genre: true },
            },
            tags: {
              include: { tag: true },
            },
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    }),
  ]);

  const entries = series.map((entry) => {
    const sortedVolumes = sortByPaddedTitle(entry.volumes);

    return {
      ...entry,
      coverImage:
        sortedVolumes.length > 0
          ? `/api/library/manga/cover/${sortedVolumes[sortedVolumes.length - 1].slug}/${sortedVolumes[sortedVolumes.length - 1].coverImage}`
          : null,
      volumes:
        sortedVolumes.map((vol) => ({
          ...vol,
          coverImage: vol.coverImage
            ? `/api/library/manga/cover/${vol.slug}/${vol.coverImage}`
            : null,
          meta: vol.metadataObj || null,
          genres: vol.genres.map((g) => g.genre.name),
          tags: vol.tags.map((t) => t.tag.name),
        })) ?? [],
    };
  });

  const total = entries.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const paginatedEntries = entries.slice(start, start + PAGE_SIZE);

  const readCountMap = await getSeriesBulkProgress(
    user?.id,
    paginatedEntries.map((e) => e.id)
  );

  return (
    <>
      <div className="flex items-center mb-4">
        <h2 className="flex items-center text-base md:text-lg mr-4">
          <LibraryBigIcon size={28} className="mr-2" />
          {intl.manga.allSeries}
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
              href={`/${lang}/manga/${entry.slug}`}
              isSeries={true}
              isOneshot={false}
              onGoing={entry.status === "ONGOING"}
              onPause={entry.status === "HIATUS"}
              volumeCount={totalVolumes}
              cover={entry.coverImage}
              progressRatio={progressRatio}
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
            lang={lang}
            intl={intl}
            basePath="/series"
          />
        </div>
      )}
    </>
  );
}
