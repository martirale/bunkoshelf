import { getDictionary } from "@/lib/i18n/serverDictionary";
import { BookHeart } from "lucide-react";

export default async function FavoritesPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4">
      <h2 className="flex items-center mb-4">
        <BookHeart className="w-7 h-7 mr-2" />
        {intl.favorites.title}
      </h2>
    </div>
  );
}
