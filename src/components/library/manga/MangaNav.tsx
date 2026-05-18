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
import {
  getLibraryRootHref,
  type LibrarySection,
} from "@/lib/librarySection";
import type { Locale, Dictionary, DictionarySection } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

interface MangaNavProps {
  lang: Locale;
  intl: Dictionary;
  section?: LibrarySection;
}

interface NavLink {
  label: string | DictionarySection;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  count?: number | null;
}

interface Stats {
  totalVolumes: number | null;
  totalSeries: number | null;
  totalUnread: number | null;
}

export default function MangaNav({
  lang,
  intl,
  section = "manga",
}: MangaNavProps) {
  const pathname = usePathname();
  const [stats, setStats] = useState<Stats>({
    totalVolumes: null,
    totalSeries: null,
    totalUnread: null,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getReaderStats();
        setStats({
          totalVolumes: data.totalVolumes ?? null,
          totalSeries: data.totalSeries ?? null,
          totalUnread: data.readingProgressSummary?.totalUnread ?? null,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }

    fetchStats();
  }, []);

  const links: NavLink[] = [
    {
      label: intl.libraries.overview,
      href: getLibraryRootHref(lang, section),
      icon: LayoutPanelTopIcon,
      isActive: pathname === getLibraryRootHref(lang, section),
    },
    {
      label: intl.libraries.series,
      href: `${getLibraryRootHref(lang, section)}/series`,
      icon: LibraryBigIcon,
      isActive: pathname === `${getLibraryRootHref(lang, section)}/series`,
      count: stats.totalSeries,
    },
    {
      label: intl.libraries.volumes,
      href: `${getLibraryRootHref(lang, section)}/volumes`,
      icon: BookCopyIcon,
      isActive: pathname === `${getLibraryRootHref(lang, section)}/volumes`,
      count: stats.totalVolumes,
    },
    {
      label: intl.libraries.toRead,
      href: `${getLibraryRootHref(lang, section)}/toread`,
      icon: BookmarkIcon,
      isActive: pathname === `${getLibraryRootHref(lang, section)}/toread`,
      count: stats.totalUnread,
    },
  ];

  return (
    <nav className="flex justify-center gap-2 md:gap-4">
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
            "transition-all duration-300 group",
          )}
        >
          <Icon size={20} className="mr-0 md:mr-2" />
          <span className="hidden md:inline">{label as string}</span>
          {typeof count === "number" && (
            <span
              className={clsx(
                "text-xs px-2 py-0.5 rounded-sm",
                "group-hover:bg-pearl transition-all duration-300",
                {
                  "bg-pearl": isActive,
                  "bg-sand": !isActive,
                },
                "ml-1 md:ml-2",
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
