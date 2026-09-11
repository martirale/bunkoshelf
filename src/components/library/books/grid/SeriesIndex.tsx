import MangaCard from "@/components/ui/MangaCard";
import { getBookCoverUrl } from "@/lib/books/cover";
import { listBookVolumes } from "@/lib/db/books/library";
import { LibraryBigIcon } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/types";

export default async function SeriesIndex({ lang, intl }: { lang: Locale; intl: Dictionary }) {
  const books = await listBookVolumes();
  const series = Array.from(books.reduce((map, book) => {
    const current = map.get(book.series.id) ?? { ...book.series, cover: getBookCoverUrl(book.slug, book.metadata.coverPath), count: 0 };
    current.count++;
    map.set(book.series.id, current);
    return map;
  }, new Map<string, { id: string; slug: string; title: string; cover: string | null; count: number }>()).values());
  return <><div className="mb-4 flex items-center"><h2 className="flex items-center text-base md:text-lg"><LibraryBigIcon size={28} className="mr-2" />{intl.libraries.series as string}</h2></div><section className="grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-7">{series.map((item) => <MangaCard key={item.id} title={item.title} href={`/${lang}/books/${item.slug}`} isSeries isOneshot={false} onGoing={false} onPause={false} volumeCount={item.count} cover={item.cover} intl={intl} isDragging={false} seriesSlug={item.slug} className="font-roboto font-bold leading-5 text-base 2xl:text-lg" />)}</section></>;
}
