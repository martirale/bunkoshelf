import { getDictionary } from "@/lib/i18n/Dictionary";
import SeriesIndexFav from "@/components/library/manga/grid/SeriesIndexFav";
import VolumesIndexFav from "@/components/library/manga/grid/VolumesIndexFav";
import { Heart } from "lucide-react";

export default async function FavoritesPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4 mb-24">
      <h1 className="flex items-center">
        <Heart className="w-7 h-7 mr-2" />
        {intl.favorites.title}
      </h1>

      <SeriesIndexFav lang={lang} intl={intl} />

      <VolumesIndexFav lang={lang} intl={intl} />
    </div>
  );
}
