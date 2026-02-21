"use client";

import { useState, useEffect } from "react";
import { getSessionData } from "@/actions/session";
import MobNavButton from "./MobNavButton";

export default function MobNavContent({ lang, intl }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getSessionData().then(setData);
  }, []);

  return (
    <MobNavButton
      lang={lang}
      intl={intl}
      user={data?.user ?? null}
      challengeData={data?.challengeData ?? null}
      versionData={data?.versionData ?? null}
    />
  );
}
