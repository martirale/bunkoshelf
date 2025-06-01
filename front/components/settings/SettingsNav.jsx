"use client";

import Link from "next/link";
import { Bolt, UsersRound, FolderCog } from "lucide-react";
import { usePathname, useParams } from "next/navigation";
import clsx from "clsx";

export default function SettingsNav({ intl }) {
  const params = useParams();
  const pathname = usePathname();
  const currentLang = params.lang || "es";

  const isSettings = pathname === `/${currentLang}/settings`;
  const isUsers = pathname.startsWith(`/${currentLang}/settings/users`);
  const isLibrary = pathname.startsWith(`/${currentLang}/settings/library`);

  return (
    <>
      <div className="border-t border-sand mt-4 md:mt-16 mb-2"></div>
      <div className="md:space-y-2 md:block flex gap-1">
        <Link
          href={`/${currentLang}/settings`}
          className={clsx(
            "flex items-center p-4 rounded-lg leading-none text-onix transition-all duration-300",
            {
              "bg-sand": isSettings,
              "hover:bg-sand": !isSettings,
            },
            "md:w-full justify-center md:justify-start flex-1"
          )}
        >
          <Bolt className="w-5 h-5 mr-0 md:mr-2" />
          <span className="hidden md:inline">{intl.settings.overview}</span>
        </Link>

        <Link
          href={`/${currentLang}/settings/users`}
          className={clsx(
            "flex items-center p-4 rounded-lg leading-none text-onix transition-all duration-300",
            {
              "bg-sand": isUsers,
              "hover:bg-sand": !isUsers,
            },
            "md:w-full justify-center md:justify-start flex-1"
          )}
        >
          <UsersRound className="w-5 h-5 mr-0 md:mr-2" />
          <span className="hidden md:inline">{intl.settings.users}</span>
        </Link>

        <Link
          href={`/${currentLang}/settings/library`}
          className={clsx(
            "flex items-center p-4 rounded-lg leading-none text-onix transition-all duration-300",
            {
              "bg-sand": isLibrary,
              "hover:bg-sand": !isLibrary,
            },
            "md:w-full justify-center md:justify-start flex-1"
          )}
        >
          <FolderCog className="w-5 h-5 mr-0 md:mr-2" />
          <span className="hidden md:inline">{intl.settings.library}</span>
        </Link>
      </div>
    </>
  );
}
