import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/Dictionary";
import ReadingChallenge from "@/components/profile/ReadingChallenge";
import ReaderStatsPanel from "@/components/stats/ReaderPanel";
import UserAvatar from "@/components/profile/UserAvatar";
import MonthlyReads from "@/components/stats/MonthlyReads";
import TopGenres from "@/components/stats/TopGenres";
import ReadingHeatmap from "@/components/stats/ReadingHeatmap";
import Challenges from "@/components/challenges/Challenges";
import type { Locale } from "@/lib/types";

interface ProfilePageProps {
  params: Promise<{ lang: string }>;
}

function AvatarSkeleton() {
  return <div className="h-20 w-full rounded-lg bg-sand animate-pulse mb-4" />;
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 w-full gap-4 mt-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[110px] rounded-lg bg-blackamber animate-pulse" />
      ))}
    </div>
  );
}

function ChallengesSkeleton() {
  return <div className="h-24 w-full rounded-lg bg-sand animate-pulse" />;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { lang = "es" } = await params;
  const intl = await getDictionary(lang as Locale);

  return (
    <>
      <Suspense fallback={<AvatarSkeleton />}>
        <UserAvatar intl={intl} />
      </Suspense>

      <div className="flex flex-col 2xl:flex-row gap-4">
        <div className="flex w-full 2xl:w-1/2">
          <Suspense fallback={<div className="w-full rounded-lg bg-blackamber animate-pulse h-[128px]" />}>
            <ReadingChallenge lang={lang as Locale} intl={intl} />
          </Suspense>
        </div>

        <div className="flex w-full 2xl:w-1/2">
          <Suspense fallback={<StatsSkeleton />}>
            <ReaderStatsPanel
              intl={intl}
              bgColor="bg-blackamber"
              textColor="text-sand"
              mdCols="md:grid-cols-3"
            />
          </Suspense>
        </div>
      </div>

      <div className="mt-4">
        <Suspense fallback={<ChallengesSkeleton />}>
          <Challenges intl={intl} />
        </Suspense>
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
