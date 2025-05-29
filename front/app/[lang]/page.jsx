import HomeRowHeroManga from "@/components/home/manga/HomeRowHeroManga";
import HomeRowNewVol from "@/components/home/manga/HomeRowNewVol";
import ReaderStatsPanel from "@/components/stats/ReaderStatsPanel";
import { getDictionary } from "@/lib/i18n/Dictionary";

export default async function HomePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <div className="flex flex-col md:flex-row p-4 mb-24 gap-4 bg-pearl">
        <div className="w-full md:w-1/2">
          <HomeRowHeroManga lang={lang} intl={intl} />
        </div>

        <div className="w-full md:w-1/2">
          <ReaderStatsPanel lang={lang} intl={intl} />
          <HomeRowNewVol lang={lang} intl={intl} />
        </div>
      </div>
    </>
  );
}
