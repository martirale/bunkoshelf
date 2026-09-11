import type { LucideIcon } from "lucide-react";
import {
  BookCopyIcon,
  BookmarkIcon,
  LayoutPanelTopIcon,
  LibraryBigIcon,
} from "lucide-react";
import {
  getLibraryRootHref,
  type LibrarySection,
} from "@/lib/librarySection";
import type { Dictionary, DictionarySection, Locale } from "@/lib/types";

interface MangaNavStats {
  totalVolumes: number | null;
  totalSeries: number | null;
  totalUnread: number | null;
}

export interface MangaNavLink {
  label: string | DictionarySection;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  count?: number | null;
}

interface GetMangaNavLinksParams {
  lang: Locale;
  intl: Dictionary;
  section: LibrarySection;
  pathname: string;
  stats: MangaNavStats;
}

export function getMangaNavLinks({
  lang,
  intl,
  section,
  pathname,
  stats,
}: GetMangaNavLinksParams): MangaNavLink[] {
  const rootHref = getLibraryRootHref(lang, section);
  const libraries = intl.libraries as DictionarySection;
  const seriesLabel = section === "others"
    ? libraries.otherCollections
    : libraries.series;
  const volumesLabel = section === "comic"
    ? libraries.comicIssues
    : section === "others"
      ? libraries.otherWorks
      : libraries.volumes;

  return [
    {
      label: intl.libraries.overview,
      href: rootHref,
      icon: LayoutPanelTopIcon,
      isActive: pathname === rootHref,
    },
    {
      label: seriesLabel,
      href: `${rootHref}/series`,
      icon: LibraryBigIcon,
      isActive: pathname === `${rootHref}/series`,
      count: stats.totalSeries,
    },
    {
      label: volumesLabel,
      href: `${rootHref}/volumes`,
      icon: BookCopyIcon,
      isActive: pathname === `${rootHref}/volumes`,
      count: stats.totalVolumes,
    },
    {
      label: intl.libraries.toRead,
      href: `${rootHref}/toread`,
      icon: BookmarkIcon,
      isActive: pathname === `${rootHref}/toread`,
      count: stats.totalUnread,
    },
  ];
}
