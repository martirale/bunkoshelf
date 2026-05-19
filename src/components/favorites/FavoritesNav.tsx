"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { BookCopyIcon, BookHeartIcon, LibraryBigIcon } from "lucide-react";
import clsx from "clsx";
import type { Dictionary, DictionarySection, Locale } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

interface FavoritesNavProps {
  intl: Dictionary;
}

interface NavLink {
  label: string | DictionarySection;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  badge?: string;
}

export default function FavoritesNav({
  intl,
}: FavoritesNavProps) {
  const params = useParams<{ lang: Locale }>();
  const pathname = usePathname();
  const currentLang = params.lang || "es";

  const links: NavLink[] = [
    {
      label: intl.favorites.sectionMangaSeries,
      href: `/${currentLang}/favorites/manga`,
      icon: LibraryBigIcon,
      isActive: pathname === `/${currentLang}/favorites/manga`,
      badge: "M",
    },
    {
      label: intl.favorites.sectionMangaVolumes,
      href: `/${currentLang}/favorites/manga/volumes`,
      icon: BookCopyIcon,
      isActive: pathname === `/${currentLang}/favorites/manga/volumes`,
      badge: "M",
    },
    {
      label: intl.favorites.sectionOthersSeries,
      href: `/${currentLang}/favorites/others`,
      icon: LibraryBigIcon,
      isActive: pathname === `/${currentLang}/favorites/others`,
      badge: "C",
    },
    {
      label: intl.favorites.sectionOthersVolumes,
      href: `/${currentLang}/favorites/others/volumes`,
      icon: BookCopyIcon,
      isActive: pathname === `/${currentLang}/favorites/others/volumes`,
      badge: "C",
    },
    {
      label: intl.favorites.sectionBooks,
      href: `/${currentLang}/favorites/books`,
      icon: BookHeartIcon,
      isActive: pathname === `/${currentLang}/favorites/books`,
    },
  ];

  return (
    <div className="mt-4 md:mt-16">
      <nav className="md:space-y-2 md:block flex gap-1">
        {links.map(({ href, icon: Icon, label, isActive, badge }, index) => (
          <Link
            key={index}
            href={href}
            prefetch={false}
            className={clsx(
              "flex items-center p-4 rounded-lg leading-none text-onix md:w-full justify-center md:justify-start flex-1 transition-all duration-300",
              {
                "bg-sand": isActive,
                "hover:bg-sand": !isActive,
              },
              "group"
            )}
            aria-label={label as string}
          >
            <Icon size={20} className="mr-0 md:mr-2" />
            <span className="hidden md:inline">{label as string}</span>
            {badge && (
              <span
                className={clsx(
                  "text-xs px-2 py-0.5 rounded-sm md:hidden",
                  "group-hover:bg-pearl transition-all duration-300",
                  {
                    "bg-pearl": isActive,
                    "bg-sand": !isActive,
                  },
                  "ml-1"
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
