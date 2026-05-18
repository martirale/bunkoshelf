import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import { getChallengeData } from "@/lib/utils";
import MobNavButton from "./MobNavButton";
import { getVersionInfo } from "@/lib/versionInfo";
import { isOthersLibraryEnabled } from "@/lib/db/appSettings";
import type { Locale } from "@/lib/types";

interface MobNavProps {
  lang: Locale;
}

export default async function MobNav({ lang }: MobNavProps) {
  const intl = await getDictionary(lang);
  const user = await verifySession();
  const challengeData = await getChallengeData(user);
  const versionData = await getVersionInfo();
  const othersLibraryEnabled = await isOthersLibraryEnabled();

  return (
    <div className="fixed bottom-8 right-6 z-50 md:hidden">
      <MobNavButton
        lang={lang}
        intl={intl}
        user={user}
        challengeData={challengeData}
        versionData={versionData}
        isOthersEnabled={othersLibraryEnabled}
      />
    </div>
  );
}
