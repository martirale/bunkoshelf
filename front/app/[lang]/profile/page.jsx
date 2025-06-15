import { getDictionary } from "@/lib/i18n/Dictionary";
import ReadingChallenge from "@/components/profile/ReadingChallenge";
import ReaderStatsPanel from "@/components/stats/ReaderPanel";
import UserAvatar from "@/components/profile/UserAvatar";
import MonthlyReads from "@/components/stats/MonthlyReads";

export default async function ProfilePage({ params }) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  return (
    <>
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

      {/* Monthly Reads */}
      <div className="mt-4">
        <MonthlyReads
          intl={intl}
          bgColor="bg-blackamber"
          textColor="text-sand"
        />
      </div>
    </>
  );
}
