import NextVol from "@/components/library/manga/row/NextVol";
import NewVols from "@/components/library/manga/row/NewVols";
import DemographicsTiles from "@/components/library/manga/Demographics";
import RecentlyRead from "@/components/library/manga/row/RecentlyRead";
import { getDictionary } from "@/lib/i18n/Dictionary";
import type { Locale } from "@/lib/types";

interface MangaPageProps {
  params: Promise<{ lang: string }>;
}

export default async function MangaPage({ params }: MangaPageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  return (
    <div className="p-4">
      <NextVol lang={lang as Locale} intl={intl} />

      <DemographicsTiles intl={intl} lang={lang as Locale} />

      <NewVols lang={lang as Locale} intl={intl} />

      <RecentlyRead lang={lang as Locale} intl={intl} />
    </div>
  );
}
