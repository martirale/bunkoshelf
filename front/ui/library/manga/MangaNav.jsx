"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function MangaNav({ lang, intl }) {
  const pathname = usePathname();

  const links = [
    { label: intl.libraries.overview, href: `/${lang}/manga` },
    { label: intl.libraries.series, href: `/${lang}/manga/series` },
    { label: intl.libraries.volumes, href: `/${lang}/manga/volumes` },
  ];

  return (
    <nav className="flex justify-center pt-12 gap-2 md:gap-4">
      {links.map(({ label, href }) => {
        const isActive = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex-1 md:flex-none md:basis-40 text-base md:text-lg text-center py-3 rounded-lg text-onix border uppercase transition-all duration-300",
              isActive
                ? "bg-sand border-sand"
                : "border-pearl hover:bg-sand hover:border-sand"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
