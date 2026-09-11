import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import VolumesIndexFav from "@/components/library/manga/grid/VolumesIndexFav";
import type { Locale } from "@/lib/types";

interface FavoritesComicVolumesPageProps { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | undefined>>; }

async function Content({ params, searchParams }: FavoritesComicVolumesPageProps) {
  const { lang = "es" } = await params;
  const { page: pageRaw = "1" } = await searchParams;
  const intl = await getDictionary(lang as Locale);
  return <VolumesIndexFav lang={lang as Locale} intl={intl} page={Number.parseInt(pageRaw, 10) || 1} scope="comic" section="comic" />;
}

export default function FavoritesComicVolumesPage(props: FavoritesComicVolumesPageProps) {
  return <Suspense fallback={null}><Content {...props} /></Suspense>;
}
