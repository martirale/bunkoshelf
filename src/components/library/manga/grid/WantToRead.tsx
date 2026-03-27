import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";
import { sortByPaddedTitle } from "@/lib/utils";
import { LibraryBigIcon } from "lucide-react";
import MangaCard from "@/components/ui/MangaCard";
import Pagination from "@/components/ui/Pagination";
import FiltersDrawer from "@/components/library/manga/FiltersDrawer";
import type { Locale, Dictionary } from "@/lib/types";

const PAGE_SIZE = 35;

interface WantToReadProps {
  lang: Locale;
  intl: Dictionary;
  page?: number;
  genreFilter?: string | string[];
  tagFilter?: string | string[];
}

export default async function WantToRead({
  lang,
  intl,
  page = 1,
  genreFilter = [],
  tagFilter = [],
}: WantToReadProps) {
  const user = await verifySession();
  if (!user) return null;

  const genreList =
    typeof genreFilter === "string" ? genreFilter.split(",") : genreFilter;
  const tagList =
    typeof tagFilter === "string" ? tagFilter.split(",") : tagFilter;

  const conditions: Record<string, unknown>[] = [];

  if (genreList.length > 0) {
    conditions.push(
      ...genreList.map((genreName) => ({
        genres: {
          some: {
            genre: {
              name: genreName,
            },
          },
        },
      }))
    );
  }

  if (tagList.length > 0) {
    conditions.push(
      ...tagList.map((tagName) => ({
        tags: {
          some: {
            tag: {
              name: tagName,
            },
          },
        },
      }))
    );
  }

  conditions.push({
    OR: [
      {
        usersProgress: {
          none: {
            userId: user.id,
          },
        },
      },
      {
        usersProgress: {
          some: {
            userId: user.id,
            isRead: false,
          },
        },
      },
    ],
  });

  const where = { AND: conditions };

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
      usersProgress: {
        where: {
          userId: user.id,
        },
      },
    },
  });

  const sortedVolumes = sortByPaddedTitle(volumes);
  const entries = sortedVolumes.map((vol) => ({
    ...vol,
    isOneshot: vol.series?.isOneshot === true,
    coverImage: vol.coverImage
      ? `/api/library/manga/cover/${vol.slug}/${vol.coverImage}`
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
    <>
      <div className="flex items-center mb-4">
        <h2 className="flex items-center text-base md:text-lg mr-4">
          <LibraryBigIcon size={28} className="mr-2" />
          {intl.manga.wantToRead as string}
        </h2>
        <FiltersDrawer intl={intl} />
      </div>

      <section className="grid grid-cols-2 md:grid-cols-5 2xl:grid-cols-7 gap-4">
        {paginatedEntries.map((entry) => {
          const href = `/${lang}/manga/volume/${entry.slug}`;

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
            lang={lang}
            intl={intl}
            basePath="/toread"
          />
        </div>
      )}
    </>
  );
}
