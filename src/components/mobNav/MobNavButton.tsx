"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { MenuIcon, SearchIcon } from "lucide-react";
import MobNavModal from "./MobNavModal";
import type { Dictionary, Session, ChallengeData } from "@/lib/types";
import type { VersionInfo } from "@/lib/versionInfo";

interface MobNavButtonProps {
  lang: string;
  intl: Dictionary;
  user: Session | null;
  challengeData: ChallengeData | null;
  versionData: VersionInfo;
}

export default function MobNavButton({
  lang,
  intl,
  user,
  challengeData,
  versionData,
}: MobNavButtonProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      setOpen(false);
    }
  }, [pathname]);

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/${lang}/search`}
        className="bg-pearl border border-stone-300 rounded-full p-3"
        aria-label="Search"
      >
        <SearchIcon size={28} className="text-onix" />
      </Link>

      <button
        onClick={() => setOpen(true)}
        className="bg-pearl border border-stone-300 rounded-full p-3"
        aria-label="Open menu"
      >
        <MenuIcon size={28} className="text-onix" />
      </button>

      <MobNavModal
        isOpen={open}
        onClose={() => setOpen(false)}
        lang={lang}
        intl={intl}
        user={user}
        challengeData={challengeData}
        versionData={versionData}
      />
    </div>
  );
}
