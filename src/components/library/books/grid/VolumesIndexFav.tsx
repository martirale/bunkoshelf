import MangaCard from "@/components/ui/MangaCard";
import Pagination from "@/components/ui/Pagination";
import { verifySession } from "@/lib/auth/verifySession";
import { getBookCoverUrl } from "@/lib/books/cover";
import { getBookProgressRatio } from "@/lib/books/readingProgress";
import { listBookProgressByIds, listFavoriteBookVolumes } from "@/lib/db/books/library";
import { LIBRARY_PAGE_SIZE } from "@/lib/libraryPagination";
import { BookCopyIcon, GhostIcon } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/types";

export default async function VolumesIndexFav({ lang, intl, page = 1 }: { lang: Locale; intl: Dictionary; page?: number }) {
  const user = await verifySession();
  if (!user) return null;

  const books = intl.books as Record<string, string>;
  const favoritesLabels = intl.favorites as Record<string, string>;
  const favorites = await listFavoriteBookVolumes(user.id, { page, pageSize: LIBRARY_PAGE_SIZE });
  if (favorites.total === 0) {
    return <div className="flex h-80 flex-col items-center justify-center gap-4"><GhostIcon size={64} /><h2>{books.noFavoriteBooks}</h2></div>;
  }

  const progressById = await listBookProgressByIds(user.id, favorites.items.map((volume) => volume.id));

  return <>
    <h2 className="mb-4 flex items-center"><BookCopyIcon size={28} className="mr-2" />{favoritesLabels.headingBooksVolumes}</h2>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {favorites.items.map((volume) => <MangaCard key={volume.id} title={volume.metadata.title} href={`/${lang}/books/volume/${volume.slug}`} isSeries={false} isOneshot={volume.series.isOneshot} onGoing={false} onPause={false} volumeCount={null} cover={getBookCoverUrl(volume.slug, volume.metadata.coverPath)} progressRatio={getBookProgressRatio(progressById[volume.id])} isDragging={false} seriesSlug={null} offlineVolumeId={volume.id} intl={intl} className="font-roboto text-base font-bold leading-5 2xl:text-lg" />)}
    </div>
    {favorites.total > LIBRARY_PAGE_SIZE && <div className="mt-8"><Pagination currentPage={page} totalPages={favorites.totalPages} intl={intl} /></div>}
  </>;
}
