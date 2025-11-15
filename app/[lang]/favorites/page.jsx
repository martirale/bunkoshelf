import { getDictionary } from "@/lib/i18n/Dictionary";
import SeriesIndexFav from "@/components/library/manga/grid/SeriesIndexFav";
import VolumesIndexFav from "@/components/library/manga/grid/VolumesIndexFav";
import Separator from "@/components/ui/Separator";

export default async function FavoritesPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <SeriesIndexFav lang={lang} intl={intl} />
      <Separator />
      <VolumesIndexFav lang={lang} intl={intl} />
    </>
  );
}
