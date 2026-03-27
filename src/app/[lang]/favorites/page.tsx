import { getDictionary } from "@/lib/i18n/Dictionary";
import SeriesIndexFav from "@/components/library/manga/grid/SeriesIndexFav";
import VolumesIndexFav from "@/components/library/manga/grid/VolumesIndexFav";
import Separator from "@/components/ui/Separator";
import type { Locale } from "@/lib/types";

interface FavoritesPageProps {
  params: Promise<{ lang: string }>;
}

export default async function FavoritesPage({ params }: FavoritesPageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  return (
    <>
      <SeriesIndexFav lang={lang as Locale} intl={intl} />
      <Separator />
      <VolumesIndexFav lang={lang as Locale} intl={intl} />
    </>
  );
}
