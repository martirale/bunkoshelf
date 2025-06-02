"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { usePathname, useParams } from "next/navigation";
import clsx from "clsx";

export default function AdminNav({ intl }) {
  const params = useParams();
  const pathname = usePathname();
  const currentLang = params.lang || "es";
  const isSettings = pathname.startsWith(`/${currentLang}/settings`);

  return (
    <div className="mt-2 space-y-2">
      <Link
        href={`/${currentLang}/settings`}
        className={clsx(
          "flex items-center p-4 rounded-lg leading-none border transition-all duration-300",
          {
            "border-onix bg-sand text-onix md:border-sand md:bg-onix md:text-sand hover:border-lilah":
              isSettings,
            "border-pearl md:border-blackamber hover:text-pearl hover:border-lilah":
              !isSettings,
          }
        )}
      >
        <Settings2 className="w-5 h-5 mr-2" />
        {intl.sidebar.settings}
      </Link>
    </div>
  );
}
