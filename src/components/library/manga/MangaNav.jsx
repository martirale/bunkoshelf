"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutPanelTopIcon,
  LibraryBigIcon,
  BookCopyIcon,
  BookmarkIcon,
} from "lucide-react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { getReaderStats } from "@/actions/stats";

export default function MangaNav({ lang, intl }) {
  const pathname = usePathname();
  const [stats, setStats] = useState({
    totalVolumes: null,
    totalSeries: null,
    totalUnread: null,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getReaderStats();
        setStats({
          totalVolumes: data.totalVolumes,
          totalSeries: data.totalSeries,
          totalUnread: data.readingProgressSummary?.totalUnread,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }

    fetchStats();
  }, []);

  const links = [
    {
      label: intl.libraries.overview,
      href: `/${lang}/manga`,
      icon: LayoutPanelTopIcon,
      isActive: pathname === `/${lang}/manga`,
    },
    {
      label: intl.libraries.series,
      href: `/${lang}/manga/series`,
      icon: LibraryBigIcon,
      isActive: pathname === `/${lang}/manga/series`,
      count: stats.totalSeries,
    },
    {
      label: intl.libraries.volumes,
      href: `/${lang}/manga/volumes`,
      icon: BookCopyIcon,
      isActive: pathname === `/${lang}/manga/volumes`,
      count: stats.totalVolumes,
    },
    {
      label: intl.libraries.toRead,
      href: `/${lang}/manga/toread`,
      icon: BookmarkIcon,
      isActive: pathname === `/${lang}/manga/toread`,
      count: stats.totalUnread,
    },
  ];

  return (
    <nav className="flex justify-center pt-4 gap-2 md:gap-4">
      {links.map(({ label, href, icon: Icon, isActive, count }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            "flex flex-1 2xl:flex-none 2xl:basis-50 items-center justify-center",
            "text-onix leading-none uppercase px-2 py-4 rounded-lg",
            {
              "bg-sand": isActive,
              "hover:bg-sand": !isActive,
            },
            "transition-all duration-300 group"
          )}
        >
          <Icon size={20} className="mr-0 md:mr-2" />
          <span className="hidden md:inline">{label}</span>
          {typeof count === "number" && (
            <span
              className={clsx(
                "text-xs px-2 py-0.5 rounded-sm",
                "group-hover:bg-pearl transition-all duration-300",
                {
                  "bg-pearl": isActive,
                  "bg-sand": !isActive,
                },
                "ml-1 md:ml-2"
              )}
            >
              {count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
