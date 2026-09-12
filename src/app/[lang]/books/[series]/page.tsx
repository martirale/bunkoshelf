import { Suspense } from "react";
import { notFound } from "next/navigation";
import { listBookProgressByIds, listBookVolumes } from "@/lib/db/books/library";
import { findBookSeriesFavorite } from "@/lib/db/books/reading";
import { verifySession } from "@/lib/auth/verifySession";
import BookSeriesContent from "@/components/library/books/BookSeriesContent";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

function DetailSkeleton() {
  return <div className="p-4"><div className="h-[32rem] animate-pulse rounded-lg bg-sand md:w-5/12" /></div>;
}

async function BookSeriesPageContent({ params }: { params: Promise<{ lang: string; series: string }> }) {
  const { lang, series } = await params;
  const intl = await getDictionary(lang as Locale);
  const user = await verifySession();
  const books = await listBookVolumes({ seriesSlug: series });
  if (!books.length) notFound();
  const [progressById, isFavorite] = user ? await Promise.all([
    listBookProgressByIds(user.id, books.map((book) => book.id)),
    findBookSeriesFavorite(user.id, books[0].series.id),
  ]) : [{}, false] as const;
  return <BookSeriesContent volumes={books} lang={lang as Locale} intl={intl} progressById={progressById} isFavorite={isFavorite} isAdmin={user?.isAdmin === true} />;
}

export default function BookSeriesPage(props: { params: Promise<{ lang: string; series: string }> }) {
  return <Suspense fallback={<DetailSkeleton />}><BookSeriesPageContent {...props} /></Suspense>;
}
