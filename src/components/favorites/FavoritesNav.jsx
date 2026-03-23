"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { BookHeartIcon } from "lucide-react";
import clsx from "clsx";

export default function FavoritesNav({ intl }) {
  const params = useParams();
  const pathname = usePathname();
  const currentLang = params.lang || "es";

  const links = [
    {
      label: intl.favorites.sectionManga,
      href: `/${currentLang}/favorites`,
      icon: BookHeartIcon,
      isActive: pathname === `/${currentLang}/favorites`,
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
            className={clsx(
              "flex flex-col md:flex-row justify-center md:justify-start w-full items-center p-4 rounded-lg leading-none text-onix transition-all duration-300",
              isActive ? "bg-sand" : "hover:bg-sand"
            )}
          >
            <span className="flex">
              <Icon size={20} className="mr-1 md:mr-2" />
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
