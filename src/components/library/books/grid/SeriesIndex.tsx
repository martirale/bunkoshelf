import MangaCard from "@/components/ui/MangaCard";
import { verifySession } from "@/lib/auth/verifySession";
import { getBookCoverUrl } from "@/lib/books/cover";
import { listBookProgressByIds, listBookVolumes } from "@/lib/db/books/library";
import { LibraryBigIcon } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/types";

export default async function SeriesIndex({
  lang,
  intl,
  authorFilter,
  includeOneshots = false,
}: {
  lang: Locale;
  intl: Dictionary;
  authorFilter?: string;
  includeOneshots?: boolean;
}) {
  const labels = intl.books as Record<string, string>;
  const user = await verifySession();
  const authorNames = authorFilter?.trim() ? [authorFilter.trim()] : undefined;
  const books = await listBookVolumes({ authorNames });
  const visibleBooks = includeOneshots
    ? books
    : books.filter((book) => !book.series.isOneshot);
  const progressById = user
    ? await listBookProgressByIds(user.id, visibleBooks.map((book) => book.id))
    : {};
  const series = Array.from(visibleBooks.reduce((map, book) => {
    const current = map.get(book.series.id) ?? {
      ...book.series,
      title: book.series.isOneshot ? book.metadata.title : book.series.title,
      cover: getBookCoverUrl(book.slug, book.metadata.coverPath),
      firstSlug: book.slug,
      volumeIds: [] as string[],
    };
    current.volumeIds.push(book.id);
    map.set(book.series.id, current);
    return map;
  }, new Map<string, { id: string; slug: string; title: string; isOneshot: boolean; status: string; cover: string | null; firstSlug: string; volumeIds: string[] }>()).values());

  return <>
    <div className="mb-4 flex items-center">
      <h2 className="flex items-center text-base md:text-lg"><LibraryBigIcon size={28} className="mr-2" />{intl.libraries.series as string}</h2>
    </div>
    <section className="grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-7">
      {series.map((item) => {
        const progressRatio = item.volumeIds.length
          ? item.volumeIds.filter((id) => progressById[id]?.isRead).length / item.volumeIds.length
          : 0;
        return <MangaCard key={item.id} title={item.title} href={item.isOneshot ? `/${lang}/books/volume/${item.firstSlug}` : `/${lang}/books/${item.slug}`} isSeries={!item.isOneshot} isOneshot={item.isOneshot} onGoing={!item.isOneshot && item.status === "ONGOING"} onPause={false} volumeCount={item.isOneshot ? null : item.volumeIds.length} countLabel={labels.books} cover={item.cover} progressRatio={progressRatio} intl={intl} isDragging={false} seriesSlug={item.slug} className="font-roboto font-bold leading-5 text-base 2xl:text-lg" />;
      })}
    </section>
  </>;
}
