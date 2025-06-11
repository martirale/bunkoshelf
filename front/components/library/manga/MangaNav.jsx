"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bolt, LibraryBig, BookCopy, Bookmark } from "lucide-react";
import clsx from "clsx";

export default function MangaNav({ lang, intl }) {
  const pathname = usePathname();

  const links = [
    {
      label: intl.libraries.overview,
      href: `/${lang}/manga`,
      icon: Bolt,
      isActive: pathname === `/${lang}/manga`,
    },
    {
      label: intl.libraries.series,
      href: `/${lang}/manga/series`,
      icon: LibraryBig,
      isActive: pathname === `/${lang}/manga/series`,
    },
    {
      label: intl.libraries.volumes,
      href: `/${lang}/manga/volumes`,
      icon: BookCopy,
      isActive: pathname === `/${lang}/manga/volumes`,
    },
    {
      label: intl.libraries.toRead,
      href: `/${lang}/manga/toread`,
      icon: Bookmark,
      isActive: pathname === `/${lang}/manga/toread`,
    },
  ];

  return (
    <nav className="flex justify-center pt-4 gap-2 md:gap-4">
      {links.map(({ label, href, icon: Icon, isActive }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            "flex items-center px-2 py-4 rounded-lg uppercase leading-none text-onix justify-center flex-1 2xl:flex-none 2xl:basis-50 transition-all duration-300",
            {
              "bg-sand": isActive,
              "hover:bg-sand": !isActive,
            }
          )}
        >
          <Icon className="w-5 h-5 mr-0 md:mr-2" />
          <span className="hidden md:inline">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
