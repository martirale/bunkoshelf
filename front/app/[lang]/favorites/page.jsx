import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function FavoritesPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4">
      <h2>{intl.favorites.title}</h2>
    </div>
  );
}
