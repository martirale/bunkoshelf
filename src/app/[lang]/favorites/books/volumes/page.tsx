import VolumesIndexFav from "@/components/library/books/grid/VolumesIndexFav";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

export default async function FavoriteBookVolumesPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { lang } = await params;
  const { page: pageRaw = "1" } = await searchParams;
  const intl = await getDictionary(lang as Locale);
  return <VolumesIndexFav lang={lang as Locale} intl={intl} page={Number.parseInt(pageRaw, 10) || 1} />;
}
