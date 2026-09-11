import type { BookVolume } from "@/lib/db/books/library";
import { getBookCoverUrl } from "@/lib/books/cover";
import MangaCard from "@/components/ui/MangaCard";
import type { Dictionary } from "@/lib/types";

interface BookGridProps {
  books: BookVolume[];
  lang: string;
  intl: Dictionary;
  progressById?: Record<string, { progression: number | null }>;
}

export default function BookGrid({ books, lang, intl, progressById = {} }: BookGridProps) {
  if (!books.length) return <p className="p-4 text-center">No hay libros indexados todavía.</p>;
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-7">
    {books.map((book) => {
      const cover = getBookCoverUrl(book.slug, book.metadata.coverPath);
      return <MangaCard key={book.id} title={book.metadata.title} href={`/${lang}/books/volume/${book.slug}`}
        isSeries={false} isOneshot={false} onGoing={false} onPause={false} volumeCount={null}
        cover={cover} intl={intl} isDragging={false} seriesSlug={null} progressRatio={progressById[book.id]?.progression ?? null}
        className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg" />;
    })}
  </div>;
}
