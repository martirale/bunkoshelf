import HomeRowKeepRead from "@/components/home/manga/HomeRowKeepRead";
import HomeRowNewVol from "@/components/home/manga/HomeRowNewVol";
import ReaderStatsPanel from "@/components/stats/ReaderStatsPanel";
import { getDictionary } from "@/lib/i18n/Dictionary";
import AlertBox from "@/ui/AlertBox";

export default async function HomePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="p-4">
      <AlertBox
        title={intl.toastDev.appDevelopTt}
        description={intl.toastDev.appDevelop}
        variant="warning"
      />

      {/* User Stats */}
      <ReaderStatsPanel />

      {/* Coming Up Manga */}
      <div className="flex flex-col md:flex-row gap-4 md:pr-4">
        <div className="w-full md:w-1/2">
          <HomeRowKeepRead lang={lang} intl={intl} />
        </div>

        <div className="w-full md:w-1/2">
          <HomeRowNewVol lang={lang} intl={intl} />
        </div>
      </div>
    </div>
  );
}
