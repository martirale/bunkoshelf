import { getDictionary } from "@/lib/i18n/Dictionary";
import ReadingChallenge from "@/components/profile/ReadingChallenge";
import ReaderStatsPanel from "@/components/stats/ReaderPanel";
import UserAvatar from "@/components/profile/UserAvatar";
import MonthlyReads from "@/components/stats/MonthlyReads";
import TopGenres from "@/components/stats/TopGenres";

export default async function ProfilePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <div className="mb-24 md:mb-4">
      <UserAvatar intl={intl} />

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

      <div className="flex flex-col 2xl:flex-row gap-4 mt-4">
        <div className="flex-1/2">
          <MonthlyReads
            intl={intl}
            bgColor="bg-blackamber"
            textColor="text-sand"
          />
        </div>

        <div className="flex-1/2">
          <TopGenres
            intl={intl}
            bgColor="bg-blackamber"
            textColor="text-sand"
          />
        </div>
      </div>
    </div>
  );
}
