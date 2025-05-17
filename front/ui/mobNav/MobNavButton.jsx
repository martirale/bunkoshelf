"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Modal from "@/ui/Modal";
import { Menu } from "lucide-react";
import MenuLogo from "./menuLogo";
import MainNav from "@/components/sidebar/MainNav";
import AdminNav from "@/components/sidebar/AdminNav";
import SecondNav from "@/components/sidebar/SecondNav";
import FooterNav from "@/components/sidebar/FooterNav";

export default function MobNavButton({ intl, user }) {
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
        className="bg-blackamber border border-pearl rounded-full p-3"
      >
        <Menu className="w-6 h-6" />
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
          </div>
        )}

        <div className="mt-12 -mb-7">
          <FooterNav intl={intl} />
        </div>
      </Modal>
    </>
  );
}
