import { getDictionary } from "@/lib/i18n/Dictionary";
import ReadingChallenge from "@/components/profile/ReadingChallenge";
import ReaderStatsPanel from "@/components/stats/ReaderPanel";
import UserAvatar from "@/components/profile/UserAvatar";
import MonthlyReads from "@/components/stats/MonthlyReads";
import TopGenres from "@/components/stats/TopGenres";
import ReadingHeatmap from "@/components/stats/ReadingHeatmap";
import { verifySession } from "@/lib/auth/verifySession";
import Challenges from "@/components/challenges/Challenges";
import type { Locale } from "@/lib/types";

interface ProfilePageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang);

  const user = await verifySession();
  if (!user) return <p>No autorizado</p>;

  return (
    <>
      <UserAvatar intl={intl} />

      <div className="flex flex-col 2xl:flex-row gap-4">
        <div className="flex w-full 2xl:w-1/2">
          <ReadingChallenge lang={lang} intl={intl} />
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

      <div className="mt-4">
        <Challenges intl={intl} />
      </div>

      <ReadingHeatmap intl={intl} />

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
    </>
  );
}
