import NextVol from "@/components/library/manga/row/NextVol";
import NewVols from "@/components/library/manga/row/NewVols";
import DemographicsTiles from "@/components/library/manga/Demographics";
import RecentlyRead from "@/components/library/manga/row/RecentlyRead";
import { getDictionary } from "@/lib/i18n/Dictionary";

export default async function MangaPage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4">
      <NextVol lang={lang} intl={intl} />

      <DemographicsTiles intl={intl} lang={lang} />

      <NewVols lang={lang} intl={intl} />

      <RecentlyRead lang={lang} intl={intl} />
    </div>
  );
}
