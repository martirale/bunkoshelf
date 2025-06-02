"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { usePathname, useParams } from "next/navigation";

export default function AdminNav({ intl }) {
  // Lang options
  const params = useParams();
  const pathname = usePathname();
  const currentLang = params.lang || "es";

  // Check current routes
  const isSettings = pathname.startsWith(`/${currentLang}/settings`);

  return (
    <>
      <div className="mt-2 space-y-2">
        <Link
          href={`/${currentLang}/settings`}
          className={`flex items-center p-4 rounded-lg leading-none border ${
            isSettings
              ? "border-onix bg-sand text-onix md:border-sand md:bg-onix md:text-sand hover:border-lilah"
              : "border-pearl md:border-blackamber hover:text-pearl hover:border-lilah"
          } transition-all duration-300`}
        >
          <Settings2 className="w-5 h-5 mr-2" />
          {intl.sidebar.settings}
        </Link>
      </div>
    </>
  );
}
