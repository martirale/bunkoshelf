import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import SeriesIndexFav from "@/components/library/manga/grid/SeriesIndexFav";
import type { Locale } from "@/lib/types";

interface FavoritesComicPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

async function Content({ params, searchParams }: FavoritesComicPageProps) {
  const { lang = "es" } = await params;
  const { page: pageRaw = "1" } = await searchParams;
  const intl = await getDictionary(lang as Locale);
  return <SeriesIndexFav lang={lang as Locale} intl={intl} page={Number.parseInt(pageRaw, 10) || 1} scope="comic" section="comic" />;
}

export default function FavoritesComicPage(props: FavoritesComicPageProps) {
  return <Suspense fallback={null}><Content {...props} /></Suspense>;
}
