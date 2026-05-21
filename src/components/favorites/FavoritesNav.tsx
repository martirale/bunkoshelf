"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import clsx from "clsx";
import MobileSecondaryNav from "@/components/ui/MobileSecondaryNav";
import { getFavoritesNavLinks } from "@/lib/nav/favoritesNav";
import type { Dictionary, Locale } from "@/lib/types";

interface FavoritesNavProps {
  intl: Dictionary;
}

export default function FavoritesNav({ intl }: FavoritesNavProps) {
  const params = useParams<{ lang: Locale }>();
  const pathname = usePathname();
  const currentLang = params.lang || "es";
  const links = getFavoritesNavLinks({ intl, lang: currentLang, pathname });

  return (
    <div className="mt-4 md:mt-16">
      <MobileSecondaryNav
        items={links.map((link) => ({
          ...link,
          label: String(link.label),
        }))}
      />

      <nav className="hidden md:space-y-2 md:block">
        {links.map(({ href, icon: Icon, label, isActive, badge }, index) => (
          <Link
            key={index}
            href={href}
            prefetch={false}
            className={clsx(
              "flex items-center p-4 rounded-lg leading-none text-onix w-full justify-start transition-all duration-300",
              {
                "bg-sand": isActive,
                "hover:bg-sand": !isActive,
              },
              "group",
            )}
            aria-label={label as string}
          >
            <Icon size={20} className="mr-2" />
            <span>{label as string}</span>
            {badge && (
              <span
                className={clsx(
                  "text-xs px-2 py-0.5 rounded-sm ml-2 uppercase",
                  "group-hover:bg-pearl transition-all duration-300",
                  {
                    "bg-pearl": isActive,
                    "bg-sand": !isActive,
                  },
                )}
              >
                {badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
