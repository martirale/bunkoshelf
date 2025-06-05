import React from "react";
import MangaCard from "@/ui/library/manga/MangaCard";
import prisma from "@/lib/prisma";
import { sortByPaddedTitle } from "@/lib/utils";
import { LibraryBig } from "lucide-react";
import Pagination from "@/ui/library/manga/Pagination";
import FiltersDrawer from "../FiltersDrawer";

const PAGE_SIZE = 35;

export default async function SeriesIndex({
  lang,
  intl,
  page = 1,
  genreFilter = null,
  tagFilter = null,
}) {
  const where = {};

  if (genreFilter && tagFilter) {
    where.volumes = {
      some: {
        genres: {
          some: {
            genre: {
              name: genreFilter,
            },
          },
        },
        tags: {
          some: {
            tag: {
              name: tagFilter,
            },
          },
        },
      },
    };
  } else if (genreFilter) {
    where.volumes = {
      some: {
        genres: {
          some: {
            genre: {
              name: genreFilter,
            },
          },
        },
      },
    };
  } else if (tagFilter) {
    where.volumes = {
      some: {
        tags: {
          some: {
            tag: {
              name: tagFilter,
            },
          },
        },
      },
    };
  }

  const series = await prisma.mangaSeries.findMany({
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
  });

  const entries = series
    .filter(
      (entry) => (entry.volumes && entry.volumes.length > 1) || entry.metadata
    )
    .map((entry) => {
      const sortedVolumes = sortByPaddedTitle(entry.volumes);

      return {
        ...entry,
        coverImage:
          sortedVolumes.length > 0
            ? `/api/library/manga/cover${sortedVolumes[
                sortedVolumes.length - 1
              ].coverImage
                ?.replace(/\\/g, "/")
                .replace(/^\/?covers/, "")}` ?? null
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
            genres: vol.genres.map((g) => g.genre.name),
            tags: vol.tags.map((t) => t.tag.name),
          })) ?? [],
      };
    });

  const total = entries.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const paginatedEntries = entries.slice(start, start + PAGE_SIZE);

  return (
    <div className="mt-8">
      <div className="flex items-center mb-4">
        <h2 className="flex items-center text-base md:text-lg mr-4">
          <LibraryBig className="w-6 h-6 md:w-7 md:h-7 mr-2" />
          {intl.manga.allSeries}
        </h2>

        <FiltersDrawer intl={intl} />
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-7">
        {paginatedEntries.map((entry) => {
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
          />
        </div>
      )}
    </div>
  );
}
