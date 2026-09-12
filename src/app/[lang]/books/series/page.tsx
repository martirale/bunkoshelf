import { Suspense } from "react";
import SeriesIndex from "@/components/library/books/grid/SeriesIndex";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

function GridSkeleton() {
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-7">{Array.from({ length: 14 }).map((_, index) => <div key={index} className="aspect-[3/5] animate-pulse rounded-lg bg-sand" />)}</div>;
}

async function BookSeriesIndexContent({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { lang } = await params;
  const { author } = await searchParams;
  const intl = await getDictionary(lang as Locale);
  return <SeriesIndex lang={lang as Locale} intl={intl} authorFilter={author} />;
}

export default function BookSeriesIndex(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <main className="p-4"><Suspense fallback={<GridSkeleton />}><BookSeriesIndexContent {...props} /></Suspense></main>;
}
