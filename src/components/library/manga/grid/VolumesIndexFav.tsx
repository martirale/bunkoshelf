import MangaCard from "@/components/ui/MangaCard";
import { verifySession } from "@/lib/auth/verifySession";
import {
  listFavoriteVolumeIds,
  listPagedVolumes,
  listVolumeProgressByIds,
} from "@/lib/db/library";
import Pagination from "@/components/ui/Pagination";
import { LIBRARY_PAGE_SIZE } from "@/lib/libraryPagination";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import {
  getLibraryVolumeHref,
  type LibraryScope,
  type LibrarySection,
} from "@/lib/librarySection";
import { getVolumeProgressRatio } from "@/lib/reader/readingProgress";
import { GhostIcon, BookCopyIcon } from "lucide-react";
import type { Locale, Dictionary } from "@/lib/types";

interface VolumesIndexFavProps {
  lang: Locale;
  intl: Dictionary;
  page?: number;
  scope?: LibraryScope;
  section?: LibrarySection;
}

export default async function VolumesIndexFav({
  lang,
  intl,
  page = 1,
  scope = "all",
  section = "manga",
}: VolumesIndexFavProps) {
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

  const paginated = await listPagedVolumes({
    page,
    pageSize: LIBRARY_PAGE_SIZE,
    volumeIds: favoriteVolumeIds,
    scope,
  });
  const progressById = await listVolumeProgressByIds(
    user.id,
    paginated.items.map((volume) => volume.id)
  );

  const entries = paginated.items.map((vol) => ({
    ...vol,
    isOneshot: vol.series?.isOneshot === true,
    coverImage: getMangaCoverUrl(vol),
    meta: vol.metadataObj || null,
  }));

  return (
    <>
      <h2 className="flex items-center mb-4">
        <BookCopyIcon size={28} className="mr-2" />
        {intl.favorites.ttVolumes as string}
      </h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {entries.map((entry) => {
          const href = getLibraryVolumeHref(lang, section, entry.slug);
          const coverImage = entry.coverImage;
          const progress = progressById[entry.id] ?? null;

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
              progressRatio={getVolumeProgressRatio(progress)}
              isDragging={false}
              seriesSlug={null}
              intl={intl}
              className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
            />
          );
        })}
      </div>

      {paginated.total > LIBRARY_PAGE_SIZE && (
        <div className="mt-8">
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
