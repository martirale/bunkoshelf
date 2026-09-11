import MobNavButton from "./MobNavButton";
import type { ChallengeData, Dictionary, Locale, Session } from "@/lib/types";
import type { VersionInfo } from "@/lib/versionInfo";
import type { LibrarySectionCounts } from "@/lib/db/library";

interface MobNavProps {
  lang: Locale;
  intl: Dictionary;
  user: Session | null;
  challengeData: ChallengeData | null;
  versionData: VersionInfo;
  libraryCounts: LibrarySectionCounts;
}

export default function MobNav({
  lang,
  intl,
  user,
  challengeData,
  versionData,
  libraryCounts,
}: MobNavProps) {
  return (
    <div className="fixed bottom-8 right-6 z-50 md:hidden">
      <MobNavButton
        lang={lang}
        intl={intl}
        user={user}
        challengeData={challengeData}
        versionData={versionData}
        libraryCounts={libraryCounts}
      />
    </div>
  );
}
