"use client";

import { useEffect, useRef } from "react";
import { Minimize2Icon } from "lucide-react";
import MobNavLogo from "./MobNavLogo";
import MainNav from "@/components/sidebar/MainNav";
import SecondNav from "@/components/sidebar/SecondNav";
import ChallengeProg from "@/components/sidebar/ChallengeProg";
import FooterNav from "@/components/sidebar/FooterNav";
import type { Dictionary, Session, ChallengeData } from "@/lib/types";
import type { VersionInfo } from "@/lib/versionInfo";

interface MobNavModalProps {
  lang: string;
  intl: Dictionary;
  isOpen: boolean;
  onClose: () => void;
  user: Session | null;
  challengeData: ChallengeData | null;
  versionData: VersionInfo;
}

export default function MobNavModal({
  lang,
  intl,
  isOpen,
  onClose,
  user,
  challengeData,
  versionData,
}: MobNavModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscPress = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscPress);
    }

    return () => {
      window.removeEventListener("keydown", handleEscPress);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const timeout = setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="mob-nav-modal"
      ref={modalRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-pearl text-onix flex p-4 pointer-events-auto transition-opacity duration-200 ease-in-out opacity-100"
    >
      <div
        className="flex flex-col justify-between w-full max-w-5xl space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-row items-center justify-between">
          <MobNavLogo width={150} height={30} />
          <button onClick={onClose} className="cursor-pointer">
            <Minimize2Icon
              size={28}
              className="hover:scale-90 transition-all duration-300"
            />
          </button>
        </div>

        <div>
          {!user && <SecondNav intl={intl} />}
          {user && (
            <MainNav
              intl={intl}
              user={user}
            />
          )}
        </div>

        <div className="mt-8 mb-4">
          <ChallengeProg lang={lang} intl={intl} data={challengeData} />
          <FooterNav
            lang={lang}
            intl={intl}
            user={user}
            versionData={versionData}
          />
        </div>
      </div>
    </div>
  );
}
