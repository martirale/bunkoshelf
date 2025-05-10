"use client";

import Link from "next/link";
import { UserRoundPen } from "lucide-react";
import { usePathname, useParams } from "next/navigation";

export default function ProfileNav({ intl }) {
  // Lang options
  const params = useParams();
  const pathname = usePathname();
  const currentLang = params.lang || "es";

  // Check current routes
  const isProfile = pathname.startsWith(`/${currentLang}/profile`);

  return (
    <>
      <div className="border border-t-sand mt-16 mb-2"></div>
      <div className="space-y-2">
        <Link
          href={`/${currentLang}/profile`}
          className={`flex items-center p-4 rounded-lg leading-none text-onix ${
            isProfile ? "bg-sand" : `hover:bg-sand`
          } transition-all duration-300`}
        >
          <UserRoundPen className="w-5 h-5 mr-2" />
          {intl.profile.updateProfile}
        </Link>
      </div>
    </>
  );
}
