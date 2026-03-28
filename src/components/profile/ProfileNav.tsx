"use client";

import Link from "next/link";
import {
  LayoutPanelTopIcon,
  UserRoundPenIcon,
  BellIcon,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useParams } from "next/navigation";
import clsx from "clsx";
import type { DictionarySection } from "@/lib/types";

interface NavLink {
  label: string | DictionarySection;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
}

interface ProfileNavProps {
  intl: DictionarySection;
}

export default function ProfileNav({ intl }: ProfileNavProps) {
  const params = useParams();
  const pathname = usePathname();
  const currentLang = (params.lang as string) || "es";

  const profile = intl.profile as DictionarySection;

  const links: NavLink[] = [
    {
      label: profile.overview as string,
      href: `/${currentLang}/profile`,
      icon: LayoutPanelTopIcon,
      isActive: pathname === `/${currentLang}/profile`,
    },
    {
      label: profile.updateProfile as string,
      href: `/${currentLang}/profile/update`,
      icon: UserRoundPenIcon,
      isActive: pathname === `/${currentLang}/profile/update`,
    },
    {
      label: profile.notifications as string,
      href: `/${currentLang}/profile/notifications`,
      icon: BellIcon,
      isActive: pathname === `/${currentLang}/profile/notifications`,
    },
  ];

  return (
    <div className="mt-4 md:mt-16">
      <div className={clsx("md:space-y-2", "flex md:block gap-2")}>
        {links.map(({ href, icon: Icon, label, isActive }, index) => (
          <Link
            key={index}
            href={href}
            className={clsx(
              "flex flex-col md:flex-row justify-center md:justify-start w-full items-center p-4 rounded-lg leading-none text-onix transition-all duration-300",
              isActive ? "bg-sand" : "hover:bg-sand"
            )}
          >
            <Icon size={20} className="mr-1 md:mr-2" />
            <span className="hidden md:inline">{label as string}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
