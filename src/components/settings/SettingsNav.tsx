"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { getSettingsNavLinks } from "@/lib/nav/settingsNav";
import type { Dictionary } from "@/lib/types";

interface SettingsNavProps {
  intl: Dictionary;
}

export default function SettingsNav({ intl }: SettingsNavProps) {
  const params = useParams();
  const pathname = usePathname();
  const currentLang = (params.lang as string) || "es";

  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => {
      setHash(window.location.hash);
    };

    updateHash();
    window.addEventListener("hashchange", updateHash);

    return () => window.removeEventListener("hashchange", updateHash);
  }, []);
  const links = getSettingsNavLinks({ intl, lang: currentLang, pathname, hash });

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
