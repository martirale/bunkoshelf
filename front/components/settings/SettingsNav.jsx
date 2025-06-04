"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Bolt, UsersRound, FolderCog } from "lucide-react";
import clsx from "clsx";

export default function SettingsNav({ intl }) {
  const params = useParams();
  const pathname = usePathname();
  const currentLang = params.lang || "es";

  const links = [
    {
      label: intl.settings.overview,
      href: `/${currentLang}/settings`,
      icon: Bolt,
      isActive: pathname === `/${currentLang}/settings`,
    },
    {
      label: intl.settings.users,
      href: `/${currentLang}/settings/users`,
      icon: UsersRound,
      isActive: pathname.startsWith(`/${currentLang}/settings/users`),
    },
    {
      label: intl.settings.library,
      href: `/${currentLang}/settings/library`,
      icon: FolderCog,
      isActive: pathname.startsWith(`/${currentLang}/settings/library`),
    },
  ];

  return (
    <div className="mt-4 md:mt-16">
      <div className="md:space-y-2 md:block flex gap-1">
        {links.map(({ label, href, icon: Icon, isActive }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center p-4 rounded-lg leading-none text-onix md:w-full justify-center md:justify-start flex-1 transition-all duration-300",
              {
                "bg-sand": isActive,
                "hover:bg-sand": !isActive,
              }
            )}
          >
            <Icon className="w-5 h-5 mr-0 md:mr-2" />
            <span className="hidden md:inline">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
