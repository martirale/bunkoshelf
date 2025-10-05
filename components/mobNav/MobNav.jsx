import { getDictionary } from "@/lib/i18n/Dictionary";
import { verifySession } from "@/lib/auth/verifySession";
import { getChallengeData } from "@/lib/utils";
import MobNavButton from "./MobNavButton";

export default async function MobNav({ lang }) {
  const intl = await getDictionary(lang);
  const user = await verifySession();
  const challengeData = await getChallengeData(user);

  return (
    <div className="fixed bottom-8 right-6 z-50 md:hidden">
      <MobNavButton
        lang={lang}
        intl={intl}
        user={user}
        challengeData={challengeData}
      />
    </div>
  );
}
