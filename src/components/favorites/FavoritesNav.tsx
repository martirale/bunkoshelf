"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { BookHeartIcon } from "lucide-react";
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
      icon: BookHeartIcon,
      isActive: pathname === `/${currentLang}/favorites/manga`,
    },
    {
      label: intl.favorites.sectionMangaVolumes,
      href: `/${currentLang}/favorites/manga/volumes`,
      icon: BookHeartIcon,
      isActive: pathname === `/${currentLang}/favorites/manga/volumes`,
    },
    {
      label: intl.favorites.sectionOthersSeries,
      href: `/${currentLang}/favorites/others`,
      icon: BookHeartIcon,
      isActive: pathname === `/${currentLang}/favorites/others`,
    },
    {
      label: intl.favorites.sectionOthersVolumes,
      href: `/${currentLang}/favorites/others/volumes`,
      icon: BookHeartIcon,
      isActive: pathname === `/${currentLang}/favorites/others/volumes`,
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
      <div className={clsx("md:space-y-2", "flex md:block gap-2")}>
        {links.map(({ href, icon: Icon, label, isActive }, index) => (
          <Link
            key={index}
            href={href}
            prefetch={false}
            className={clsx(
              "flex flex-col md:flex-row justify-center md:justify-start w-full items-center p-4 rounded-lg leading-none text-onix transition-all duration-300",
              isActive ? "bg-sand" : "hover:bg-sand"
            )}
          >
            <span className="flex">
              <Icon size={20} className="mr-1 md:mr-2" />
              {label as string}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
