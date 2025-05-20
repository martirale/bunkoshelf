import LibraryRowHeroManga from "@/components/library/manga/row/LibraryRowHeroManga";
import { getDictionary } from "@/lib/i18n/serverDictionary";

export default async function MangaLayout({ children, params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <LibraryRowHeroManga lang={lang} intl={intl} />

      {children}
    </>
  );
}
