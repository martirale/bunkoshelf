import SidebarLogo from "./siebarLogo";
import SecondNav from "./SecondNav";
import MainNav from "./MainNav";
import ChallengeProg from "./ChallengeProg";
import FooterNav from "./FooterNav";
import SearchInput from "@/components/search/SearchImput";
import SearchModal from "@/components/search/SearchModal";
import type { ChallengeData, Dictionary, Locale, Session } from "@/lib/types";
import type { VersionInfo } from "@/lib/versionInfo";

interface SidebarProps {
  lang: Locale;
  intl: Dictionary;
  user: Session | null;
  challengeData: ChallengeData | null;
  versionData: VersionInfo;
}

export default function Sidebar({
  lang,
  intl,
  user,
  challengeData,
  versionData,
}: SidebarProps) {
  return (
    <>
      <aside className="hidden md:flex md:w-[35%] lg:w-[25%] xl:w-[21%] 2xl:w-[17%] bg-blackamber flex-col justify-between p-4">
        <h1 className="hidden">Bunko Shelf</h1>

        <SidebarLogo />

        {!user && <SecondNav intl={intl} className="flex-1" />}

        {user && (
          <div className="flex-1">
            <MainNav
              intl={intl}
              user={user}
            />

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
