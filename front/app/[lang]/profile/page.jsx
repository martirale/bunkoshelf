import { getDictionary } from "@/lib/i18n/Dictionary";
import { Bolt } from "lucide-react";
import ReaderStatsPanel from "@/components/stats/ReaderPanel";
import ReadingChallenge from "@/components/profile/ReadingChallenge";

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
      <ReaderStatsPanel
        intl={intl}
        bgColor="bg-blackamber"
        textColor="text-sand"
        mdCols="md:grid-cols-3 2xl:grid-cols-6"
      />

      <ReadingChallenge intl={intl} />
    </>
  );
}
