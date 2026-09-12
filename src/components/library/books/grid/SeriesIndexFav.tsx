import MangaCard from "@/components/ui/MangaCard";
import Pagination from "@/components/ui/Pagination";
import { verifySession } from "@/lib/auth/verifySession";
import { getBookCoverUrl } from "@/lib/books/cover";
import { listFavoriteBookSeries, listBookProgressByIds } from "@/lib/db/books/library";
import { LIBRARY_PAGE_SIZE } from "@/lib/libraryPagination";
import { GhostIcon, LibraryBigIcon } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/types";

export default async function SeriesIndexFav({ lang, intl, page = 1 }: { lang: Locale; intl: Dictionary; page?: number }) {
  const user = await verifySession();
  if (!user) return null;

  const books = intl.books as Record<string, string>;
  const favorites = await listFavoriteBookSeries(user.id, { page, pageSize: LIBRARY_PAGE_SIZE });
  if (favorites.total === 0) {
    return <div className="flex h-80 flex-col items-center justify-center gap-4"><GhostIcon size={64} /><h2>{books.noFavoriteSeries}</h2></div>;
  }

  const progressById = await listBookProgressByIds(user.id, favorites.items.flatMap((series) => series.volumes.map((volume) => volume.id)));

  return <>
    <h2 className="mb-4 flex items-center"><LibraryBigIcon size={28} className="mr-2" />{books.favoriteSeries}</h2>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {favorites.items.map((series) => {
        const firstVolume = series.volumes[0];
        const progressRatio = series.volumes.length
          ? series.volumes.filter((volume) => progressById[volume.id]?.isRead).length / series.volumes.length
          : 0;
        return <MangaCard key={series.id} title={series.title} href={`/${lang}/books/${series.slug}`} isSeries={!series.isOneshot} isOneshot={series.isOneshot} onGoing={false} onPause={false} volumeCount={series.isOneshot ? null : series.volumes.length} cover={firstVolume ? getBookCoverUrl(firstVolume.slug, firstVolume.metadata.coverPath) : null} progressRatio={progressRatio} isDragging={false} seriesSlug={series.slug} intl={intl} className="font-roboto text-base font-bold leading-5 2xl:text-lg" />;
      })}
    </div>
    {favorites.total > LIBRARY_PAGE_SIZE && <div className="mt-8"><Pagination currentPage={page} totalPages={favorites.totalPages} intl={intl} /></div>}
  </>;
}
