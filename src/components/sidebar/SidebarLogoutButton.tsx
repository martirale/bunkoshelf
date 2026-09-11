"use client";

import { LogOutIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { logout } from "@/actions/logout";
import type { Dictionary } from "@/lib/types";

interface SidebarLogoutButtonProps {
  intl: Dictionary;
}

export default function SidebarLogoutButton({
  intl,
}: SidebarLogoutButtonProps) {
  const params = useParams();
  const lang = (params.lang as string) || "es";

  const handleLogout = async () => {
    try {
      await logout();
      window.location.assign(`/${lang}/`);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      title={intl.tooltip.logout as string}
      aria-label={intl.tooltip.logout as string}
      className="inline-flex box-border size-9 -translate-y-1 items-center justify-center border border-neutral-800 hover:text-pearl rounded-lg cursor-pointer transition-all duration-300 hover:border-lilah"
    >
      <LogOutIcon size={20} />
    </button>
  );
}
