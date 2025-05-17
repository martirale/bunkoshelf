import LibraryRowHero from "@/components/library/manga/row/LibraryRowHero";
import { getDictionary } from "@/lib/i18n/serverDictionary";
import { LibraryBig } from "lucide-react";

export default async function MangaLayout({ children, params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <LibraryRowHero
        lang={lang}
        intl={intl}
        title={intl.libraries.keepReading}
        icon={<LibraryBig />}
      />

      {children}
    </>
  );
}
