"use client";

import Link from "next/link";
import { Bolt, UserRoundPen } from "lucide-react";
import { usePathname, useParams } from "next/navigation";
import clsx from "clsx";

export default function ProfileNav({ intl }) {
  // Lang options
  const params = useParams();
  const pathname = usePathname();
  const currentLang = params.lang || "es";

  // Check current routes
  const isProfile = pathname === `/${currentLang}/profile`;
  const isProfileUpdate = pathname.startsWith(`/${currentLang}/profile/update`);

  return (
    <>
      <div className="mt-4 md:mt-16">
        <div className={clsx("md:space-y-2", "flex md:block gap-2")}>
          <Link
            href={`/${currentLang}/profile`}
            className={clsx(
              "flex flex-col md:flex-row justify-center md:justify-start w-full items-center p-4 rounded-lg leading-none text-onix transition-all duration-300",
              isProfile ? "bg-sand" : "hover:bg-sand"
            )}
          >
            <Bolt className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">{intl.settings.overview}</span>
          </Link>

          <Link
            href={`/${currentLang}/profile/update`}
            className={clsx(
              "flex flex-col md:flex-row justify-center md:justify-start w-full items-center p-4 rounded-lg leading-none text-onix transition-all duration-300",
              isProfileUpdate ? "bg-sand" : "hover:bg-sand"
            )}
          >
            <UserRoundPen className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">
              {intl.profile.updateProfile}
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
