import { getDictionary } from "@/lib/i18n/serverDictionary";
import LibraryGridSeriesFav from "@/ui/library/manga/LibraryGridSeriesFav";
import LibraryGridVolumesFav from "@/ui/library/manga/LibraryGridVolumesFav";
import { BookHeart } from "lucide-react";

export default async function FavoritesPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4">
      <h1 className="flex items-center mb-4">
        <BookHeart className="w-7 h-7 mr-2" />
        {intl.favorites.title}
      </h1>

      <h2 className="mt-8 mb-4 py-4">Series: Manga</h2>
      <LibraryGridSeriesFav lang={lang} intl={intl} />

      <h2 className="mt-8 mb-4 py-4">Volúmenes</h2>
      <LibraryGridVolumesFav lang={lang} intl={intl} />
    </div>
  );
}
