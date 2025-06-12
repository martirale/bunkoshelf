import { getDictionary } from "@/lib/i18n/Dictionary";
import { Bolt } from "lucide-react";
import ReadingChallenge from "@/components/profile/ReadingChallenge";
import ReaderStatsPanel from "@/components/stats/ReaderPanel";

export default async function ProfilePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
      <h2 className="flex items-center mb-8">
        <Bolt className="w-7 h-7 mr-2" />
        {intl.profile.overview}
      </h2>

      {/* User Stats */}
      <div className="flex flex-col 2xl:flex-row gap-4">
        <div className="flex w-full 2xl:w-1/2">
          <ReadingChallenge intl={intl} />
        </div>

        <div className="flex w-full 2xl:w-1/2">
          <ReaderStatsPanel
            intl={intl}
            bgColor="bg-blackamber"
            textColor="text-sand"
            mdCols="md:grid-cols-3"
          />
        </div>
      </div>
    </>
  );
}
