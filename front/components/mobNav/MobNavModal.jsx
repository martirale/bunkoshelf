"use client";

import { useEffect } from "react";
import { Minimize2 } from "lucide-react";
import MobNavLogo from "./MobNavLogo";
import MainNav from "../sidebar/MainNav";
import AdminNav from "../sidebar/AdminNav";
import SecondNav from "../sidebar/SecondNav";
import ChallengeProg from "../sidebar/ChallengeProg";
import FooterNav from "../sidebar/FooterNav";
import SearchInputMob from "../search/SearchInputMob";

export default function MobNavModal({
  lang,
  intl,
  isOpen,
  onClose,
  user,
  challengeData,
}) {
  useEffect(() => {
    const handleEscPress = (event) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-pearl text-onix flex p-4">
      <div
        className="flex flex-col justify-between w-full max-w-5xl space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-row items-center justify-between">
          <MobNavLogo width={150} height={30} />

          <button onClick={onClose} className="cursor-pointer">
            <Minimize2 className="w-7 h-7 hover:scale-90 transition-all duration-300" />
          </button>
        </div>

        {/* Nav Content */}
        <div>
          {!user && <SecondNav intl={intl} />}

          {user && (
            <div>
              <MainNav intl={intl} />
              {user.isAdmin && <AdminNav intl={intl} />}

              <div className="mt-2">
                <SearchInputMob intl={intl} />
              </div>
            </div>
          )}
        </div>

        {/* Footer Nav */}
        <div className="mt-8 mb-4">
          <ChallengeProg lang={lang} intl={intl} data={challengeData} />
          <FooterNav lang={lang} intl={intl} />
        </div>
      </div>
    </div>
  );
}
