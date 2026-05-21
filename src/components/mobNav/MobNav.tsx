import MobNavButton from "./MobNavButton";
import type { ChallengeData, Dictionary, Locale, Session } from "@/lib/types";
import type { VersionInfo } from "@/lib/versionInfo";

interface MobNavProps {
  lang: Locale;
  intl: Dictionary;
  user: Session | null;
  challengeData: ChallengeData | null;
  versionData: VersionInfo;
}

export default function MobNav({
  lang,
  intl,
  user,
  challengeData,
  versionData,
}: MobNavProps) {
  return (
    <div className="fixed bottom-8 right-6 z-50 md:hidden">
      <MobNavButton
        lang={lang}
        intl={intl}
        user={user}
        challengeData={challengeData}
        versionData={versionData}
      />
    </div>
  );
}
