"use client";

import { useState, useEffect } from "react";
import { getSessionData } from "@/actions/session";
import SecondNav from "./SecondNav";
import MainNav from "./MainNav";
import ChallengeProg from "./ChallengeProg";
import FooterNav from "./FooterNav";
import SearchInput from "@/components/search/SearchImput";

export default function SidebarContent({ lang, intl }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getSessionData().then(setData);
  }, []);

  if (!data) return <div className="flex-1" />;

  const { user, challengeData, versionData } = data;

  return (
    <div className="flex flex-col flex-1 justify-between">
      <div className="flex-1">
        {!user && <SecondNav intl={intl} />}
        {user && (
          <div>
            <MainNav intl={intl} />
            <div className="mt-16">
              <SearchInput intl={intl} />
            </div>
          </div>
        )}
      </div>

      <ChallengeProg lang={lang} intl={intl} data={challengeData} />

      <FooterNav lang={lang} intl={intl} user={user} versionData={versionData} />
    </div>
  );
}
