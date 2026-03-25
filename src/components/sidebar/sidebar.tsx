import { getDictionary } from "@/lib/i18n/Dictionary";
import SidebarLogo from "./siebarLogo";
import SecondNav from "./SecondNav";
import MainNav from "./MainNav";
import ChallengeProg from "./ChallengeProg";
import FooterNav from "./FooterNav";
import { verifySession } from "@/lib/auth/verifySession";
import SearchInput from "@/components/search/SearchImput";
import SearchModal from "@/components/search/SearchModal";
import { getChallengeData } from "@/lib/utils";
import { getVersionInfo } from "@/lib/versionInfo";

import type { Locale } from "@/lib/types";

interface SidebarProps {
  lang: Locale;
}

export default async function Sidebar({ lang }: SidebarProps) {
  const intl = await getDictionary(lang);
  const user = await verifySession();
  const challengeData = await getChallengeData(user);
  const versionData = await getVersionInfo();

  return (
    <>
      <aside className="hidden md:flex md:w-[35%] lg:w-[25%] xl:w-[21%] 2xl:w-[17%] bg-blackamber flex-col justify-between p-4">
        <h1 className="hidden">Bunko Shelf</h1>

        <SidebarLogo />

        {!user && <SecondNav intl={intl} className="flex-1" />}

        {user && (
          <div className="flex-1">
            <MainNav intl={intl} user={user} />

            <div className="mt-16">
              <SearchInput intl={intl} />
            </div>
          </div>
        )}

        <ChallengeProg lang={lang} intl={intl} data={challengeData} />

        <FooterNav
          lang={lang}
          intl={intl}
          user={user}
          versionData={versionData}
        />
      </aside>

      <SearchModal lang={lang} intl={intl} />
    </>
  );
}
