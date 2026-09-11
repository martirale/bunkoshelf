"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect, useState } from "react";
import MobileSecondaryNav from "@/components/ui/MobileSecondaryNav";
import { getBooksReaderStats } from "@/actions/books";
import { BookCopyIcon, BookmarkIcon, LayoutPanelTopIcon, LibraryBigIcon } from "lucide-react";
import type { Locale, Dictionary } from "@/lib/types";

interface Stats {
  totalVolumes: number | null;
  totalSeries: number | null;
  totalUnread: number | null;
}

export default function BookNav({ lang, intl }: { lang: Locale; intl: Dictionary }) {
  const pathname = usePathname();
  const [stats, setStats] = useState<Stats>({ totalVolumes: null, totalSeries: null, totalUnread: null });
  const rootHref = `/${lang}/books`;

  useEffect(() => {
    async function fetchStats() {
      const data = await getBooksReaderStats();
      if ("error" in data) return;
      setStats(data);
    }

    fetchStats();
  }, [pathname]);

  const links = [
    { label: intl.libraries.overview as string, href: rootHref, icon: LayoutPanelTopIcon, isActive: pathname === rootHref },
    { label: intl.libraries.series as string, href: `${rootHref}/series`, icon: LibraryBigIcon, isActive: pathname === `${rootHref}/series`, count: stats.totalSeries },
    { label: intl.libraries.books as string, href: `${rootHref}/volumes`, icon: BookCopyIcon, isActive: pathname === `${rootHref}/volumes`, count: stats.totalVolumes },
    { label: intl.libraries.toRead as string, href: `${rootHref}/toread`, icon: BookmarkIcon, isActive: pathname === `${rootHref}/toread`, count: stats.totalUnread },
  ];

  return (
    <>
      <MobileSecondaryNav items={links.map((link) => ({ ...link, badge: link.count }))} />
      <nav className="hidden md:flex justify-center gap-4">
        {links.map(({ label, href, icon: Icon, isActive, count }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-1 2xl:flex-none 2xl:basis-50 items-center justify-center",
              "text-onix leading-none uppercase px-2 py-4 rounded-lg",
              { "bg-sand": isActive, "hover:bg-sand": !isActive },
              "transition-all duration-300 group",
            )}
          >
            <Icon size={20} className="mr-2" />
            <span>{label}</span>
            {typeof count === "number" && (
              <span className={clsx(
                "text-xs px-2 py-0.5 rounded-sm",
                "group-hover:bg-pearl transition-all duration-300",
                { "bg-pearl": isActive, "bg-sand": !isActive },
                "ml-2",
              )}>
                {count}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </>
  );
}
