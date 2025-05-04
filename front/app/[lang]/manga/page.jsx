import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function MangaPage({ params }) {
  const { lang } = params;
  const intl = await getDictionary(lang);

  return <></>;
}
