import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function BooksPage({ params }) {
  const { lang } = params;
  const intl = await getDictionary(lang);

  return <></>;
}
