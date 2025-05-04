import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function FavoritesPage({ params }) {
  const { lang } = params;
  const intl = await getDictionary(lang);

  return (
    <>
      <h1>{intl.sidebar.favorites}</h1>
    </>
  );
}
