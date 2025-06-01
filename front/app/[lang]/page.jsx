import HeroKeepRead from "@/components/home/manga/HeroKeepRead";
import RowNewVols from "@/components/home/manga/RowNewVols";
import ReaderStatsPanel from "@/components/stats/ReaderPanel";
import { getDictionary } from "@/lib/i18n/Dictionary";

export default async function HomePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <div className="flex flex-col md:flex-row p-4 mb-24 2xl:mb-0 gap-4 bg-pearl">
        <div className="w-full md:w-1/2">
          <HeroKeepRead lang={lang} intl={intl} />
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-between mt-8 md:mt-11">
          <ReaderStatsPanel lang={lang} intl={intl} mdCols="md:grid-cols-3" />
          <RowNewVols lang={lang} intl={intl} />
        </div>
      </div>
    </>
  );
}
