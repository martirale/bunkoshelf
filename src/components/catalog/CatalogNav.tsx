"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import clsx from "clsx";
import { getCatalogNavLinks } from "@/lib/nav/catalogNav";
import type { Dictionary, Locale } from "@/lib/types";

interface CatalogNavProps {
  intl: Dictionary;
}

export default function CatalogNav({ intl }: CatalogNavProps) {
  const params = useParams<{ lang: Locale }>();
  const pathname = usePathname();
  const currentLang = params.lang || "es";
  const links = getCatalogNavLinks({ intl, lang: currentLang, pathname });

  return (
    <div className="mt-4 md:mt-16">
      <nav className="md:space-y-2 md:block flex gap-1">
        {links.map(({ href, icon: Icon, label, isActive }) => (
          <Link
            key={href}
            href={href}
            prefetch={false}
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
      </nav>
    </div>
  );
}
