import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function FavoritesPage({ params }) {
  const { lang } = params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4">
      <h2>{intl.sidebar.favorites}</h2>
    </div>
  );
}
