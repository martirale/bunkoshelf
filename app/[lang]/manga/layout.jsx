import HeroKeepRead from "@/components/library/manga/row/HeroKeepRead";
import { getDictionary } from "@/lib/i18n/Dictionary";

export default async function MangaLayout({ children, params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <HeroKeepRead lang={lang} intl={intl} />

      <div className="mb-24 md:mb-4">{children}</div>
    </>
  );
}
