"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import MobNavModal from "./MobNavModal";

export default function MobNavButton({ lang, intl, user, challengeData }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      setOpen(false);
    }
  }, [pathname]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-pearl border border-stone-300 rounded-full p-3"
      >
        <Menu className="w-7 h-7 text-onix" />
      </button>

      <MobNavModal
        isOpen={open}
        onClose={() => setOpen(false)}
        lang={lang}
        intl={intl}
        user={user}
        challengeData={challengeData}
      />
    </>
  );
}
