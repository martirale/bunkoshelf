"use client";

import { useEffect, useState } from "react";
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
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  useEffect(() => {
    const updateReaderState = () => {
      setIsReaderOpen(document.body.dataset.readerOpen === "true");
    };

    updateReaderState();
    window.addEventListener("bunko:reader-state", updateReaderState);

    return () => window.removeEventListener("bunko:reader-state", updateReaderState);
  }, []);

  if (isReaderOpen) return null;

  return (
    <div className="fixed right-[max(1.5rem,env(safe-area-inset-right))] bottom-[max(2rem,env(safe-area-inset-bottom))] z-50 md:hidden">
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
