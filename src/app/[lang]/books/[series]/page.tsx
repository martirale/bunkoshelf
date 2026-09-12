import { notFound } from "next/navigation";
import { listBookProgressByIds, listBookVolumes } from "@/lib/db/books/library";
import { findBookSeriesFavorite } from "@/lib/db/books/reading";
import { verifySession } from "@/lib/auth/verifySession";
import BookSeriesContent from "@/components/library/books/BookSeriesContent";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

export default async function BookSeriesPage({ params }: { params: Promise<{ lang: string; series: string }> }) {
  const { lang, series } = await params;
  const intl = await getDictionary(lang as Locale);
  const books = await listBookVolumes({ seriesSlug: series });
  if (!books.length) notFound();
  const user = await verifySession();
  const [progressById, isFavorite] = user ? await Promise.all([
    listBookProgressByIds(user.id, books.map((book) => book.id)),
    findBookSeriesFavorite(user.id, books[0].series.id),
  ]) : [{}, false] as const;
  return <BookSeriesContent volumes={books} lang={lang as Locale} intl={intl} progressById={progressById} isFavorite={isFavorite} isAdmin={user?.isAdmin === true} />;
}
