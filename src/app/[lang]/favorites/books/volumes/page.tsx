import { Suspense } from "react";
import VolumesIndexFav from "@/components/library/books/grid/VolumesIndexFav";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

function GridSkeleton() {
  return <section className="p-4"><div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 10 }).map((_, index) => <div key={index} className="aspect-[3/5] animate-pulse rounded-lg bg-sand" />)}</div></section>;
}

async function FavoriteBookVolumesContent({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { lang } = await params;
  const { page: pageRaw = "1" } = await searchParams;
  const intl = await getDictionary(lang as Locale);
  return <VolumesIndexFav lang={lang as Locale} intl={intl} page={Number.parseInt(pageRaw, 10) || 1} />;
}

export default function FavoriteBookVolumesPage(props: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  return <Suspense fallback={<GridSkeleton />}><FavoriteBookVolumesContent {...props} /></Suspense>;
}
