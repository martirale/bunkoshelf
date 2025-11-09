"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BoltIcon, UsersRoundIcon, FolderCogIcon } from "lucide-react";
import clsx from "clsx";

export default function SettingsNav({ intl }) {
  const params = useParams();
  const pathname = usePathname();
  const currentLang = params.lang || "es";

  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => {
      setHash(window.location.hash);
    };

    updateHash();
    window.addEventListener("hashchange", updateHash);

    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const links = [
    {
      label: intl.settings.overview,
      href: `/${currentLang}/settings#overview`,
      icon: BoltIcon,
      isActive:
        pathname === `/${currentLang}/settings` &&
        (hash === "#overview" || hash === ""),
    },
    {
      label: intl.settings.users,
      href: `/${currentLang}/settings#users`,
      icon: UsersRoundIcon,
      isActive: pathname === `/${currentLang}/settings` && hash === "#users",
    },
    {
      label: intl.settings.library,
      href: `/${currentLang}/settings/library`,
      icon: FolderCogIcon,
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
            <Icon size={20} className="mr-0 md:mr-2" />
            <span className="hidden md:inline">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
