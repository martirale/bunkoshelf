import LibraryRowHero from "@/components/library/manga/row/LibraryRowHero";
import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function MangaLayout({ children, params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <LibraryRowHero lang={lang} intl={intl} />

      {children}
    </>
  );
}
