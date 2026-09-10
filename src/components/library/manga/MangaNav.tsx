"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect, useState } from "react";
import MobileSecondaryNav from "@/components/ui/MobileSecondaryNav";
import { getReaderStats } from "@/actions/stats";
import { getReadyVolumes } from "@/lib/client/offlineLibrary";
import { usePwa } from "@/components/pwa/PwaProvider";
import {
  type LibraryScope,
  type LibrarySection,
} from "@/lib/librarySection";
import { getMangaNavLinks } from "@/lib/nav/mangaNav";
import type { Locale, Dictionary } from "@/lib/types";

interface MangaNavProps {
  lang: Locale;
  intl: Dictionary;
  section?: LibrarySection;
  scope?: LibraryScope;
  offlineUserId?: string;
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
  scope = "all",
  offlineUserId,
}: MangaNavProps) {
  const pathname = usePathname();
  const [stats, setStats] = useState<Stats>({
    totalVolumes: null,
    totalSeries: null,
    totalUnread: null,
  });
  const { online } = usePwa();

  useEffect(() => {
    async function fetchStats() {
      try {
        if (!online && offlineUserId) {
          const volumes = await getReadyVolumes(offlineUserId, section);
          const series = new Set(volumes.filter((volume) => !volume.isOneshot).map((volume) => volume.seriesId));
          setStats({
            totalVolumes: volumes.length,
            totalSeries: series.size,
            totalUnread: volumes.filter((volume) => !volume.isRead).length,
          });
          return;
        }

        const data = await getReaderStats({
          scope,
        });
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
  }, [offlineUserId, online, scope, section]);
  const links = getMangaNavLinks({ lang, intl, section, pathname, stats });

  return (
    <>
      <MobileSecondaryNav items={links.map((link) => ({
        ...link,
        label: String(link.label),
        badge: link.count,
      }))} />

      <nav className="hidden md:flex justify-center gap-4">
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
            <Icon size={20} className="mr-2" />
            <span>{label as string}</span>
            {typeof count === "number" && (
              <span
                className={clsx(
                  "text-xs px-2 py-0.5 rounded-sm",
                  "group-hover:bg-pearl transition-all duration-300",
                  {
                    "bg-pearl": isActive,
                    "bg-sand": !isActive,
                  },
                  "ml-2",
                )}
              >
                {count}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </>
  );
}
