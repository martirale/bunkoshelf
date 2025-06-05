import React from "react";
import MangaCard from "@/ui/library/manga/MangaCard";
import prisma from "@/lib/prisma";
import { sortByPaddedTitle } from "@/lib/utils";
import { LibraryBig } from "lucide-react";
import Pagination from "@/ui/library/manga/Pagination";
import FiltersDrawer from "../FiltersDrawer";

const PAGE_SIZE = 35;

export default async function VolumesIndex({
  lang,
  intl,
  page = 1,
  genreFilter = null,
  tagFilter = null,
}) {
  const where = {};

  if (genreFilter) {
    where.genres = {
      some: {
        genre: {
          name: genreFilter,
        },
      },
    };
  }

  if (tagFilter) {
    where.tags = {
      some: {
        tag: {
          name: tagFilter,
        },
      },
    };
  }

  const volumes = await prisma.mangaVolume.findMany({
    where,
    include: {
      metadataObj: true,
      genres: {
        include: {
          genre: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      series: true,
    },
  });

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
    genres: vol.genres.map((g) => g.genre.name),
    tags: vol.tags.map((t) => t.tag.name),
  }));

  const total = entries.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const paginatedEntries = entries.slice(start, start + PAGE_SIZE);

  return (
    <div className="mt-8">
      <h2 className="flex items-center mb-4 text-base md:text-lg">
        <LibraryBig className="w-6 h-6 md:w-7 md:h-7 mr-2" />
        {intl.manga.allVolumes}
      </h2>

      <FiltersDrawer />

      <section className="grid grid-cols-2 md:grid-cols-5 2xl:grid-cols-7 gap-4">
        {paginatedEntries.map((entry) => {
          const href = `/${lang}/manga/volume/${entry.slug}`;

          return (
            <MangaCard
              key={entry.title}
              title={entry.meta.title}
              href={href}
              isSeries={false}
              isOneshot={entry.isOneshot}
              volumeCount={null}
              cover={entry.coverImage}
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
