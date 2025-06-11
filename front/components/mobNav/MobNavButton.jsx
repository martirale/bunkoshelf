"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import Modal from "../ui/Modal";
import MenuLogo from "./menuLogo";
import MainNav from "../sidebar/MainNav";
import AdminNav from "../sidebar/AdminNav";
import SecondNav from "../sidebar/SecondNav";
import FooterNav from "../sidebar/FooterNav";
import SearchInputMob from "../search/SearchInputMob";

export default function MobNavButton({ lang, intl, user }) {
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
        className="bg-pearl rounded-full p-3"
      >
        <Menu className="w-7 h-7 text-onix" />
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <div className="-mt-11 -ml-6">
          <MenuLogo width={150} height={30} />
        </div>

        {!user && <SecondNav intl={intl} className="flex-1" />}

        {user && (
          <div className="flex-1">
            <MainNav intl={intl} />
            {user.isAdmin && <AdminNav intl={intl} />}

            <div className="mt-2">
              <SearchInputMob intl={intl} />
            </div>
          </div>
        )}

        <div className="mt-8 -mb-7">
          <FooterNav lang={lang} intl={intl} />
        </div>
      </Modal>
    </>
  );
}
