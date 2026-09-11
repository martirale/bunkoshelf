import type { LucideIcon } from "lucide-react";
import { BookCopyIcon, BookHeartIcon, LibraryBigIcon } from "lucide-react";
import type { Dictionary, DictionarySection } from "@/lib/types";
import type { FavoriteSectionCounts } from "@/lib/db/library";

export interface FavoritesNavLink {
  label: string | DictionarySection;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  badge?: string;
}

interface GetFavoritesNavLinksParams {
  intl: Dictionary;
  lang: string;
  pathname: string;
  counts: FavoriteSectionCounts;
}

export function getFavoritesNavLinks({
  intl,
  lang,
  pathname,
  counts,
}: GetFavoritesNavLinksParams): FavoritesNavLink[] {
  const favorites = intl.favorites as DictionarySection;

  return [
    ...(counts.mangaSeries > 0 ? [{
      label: favorites.sectionManga,
      href: `/${lang}/favorites/manga`,
      icon: LibraryBigIcon,
      isActive: pathname === `/${lang}/favorites/manga`,
      badge: favorites.badgeSeries as string,
    }] : []),
    ...(counts.mangaVolumes > 0 ? [{
      label: favorites.sectionManga,
      href: `/${lang}/favorites/manga/volumes`,
      icon: BookCopyIcon,
      isActive: pathname === `/${lang}/favorites/manga/volumes`,
      badge: favorites.badgeVolumes as string,
    }] : []),
    ...(counts.comicSeries > 0 ? [{
      label: favorites.sectionComic,
      href: `/${lang}/favorites/comic`,
      icon: LibraryBigIcon,
      isActive: pathname === `/${lang}/favorites/comic`,
      badge: favorites.badgeComicSeries as string,
    }] : []),
    ...(counts.comicVolumes > 0 ? [{
      label: favorites.sectionComic,
      href: `/${lang}/favorites/comic/volumes`,
      icon: BookCopyIcon,
      isActive: pathname === `/${lang}/favorites/comic/volumes`,
      badge: favorites.badgeComicVolumes as string,
    }] : []),
    ...(counts.books > 0 ? [{
      label: favorites.sectionBooks,
      href: `/${lang}/favorites/books`,
      icon: BookHeartIcon,
      isActive: pathname === `/${lang}/favorites/books`,
    }] : []),
    ...(counts.otherSeries > 0 ? [{
      label: favorites.sectionOthers,
      href: `/${lang}/favorites/others`,
      icon: LibraryBigIcon,
      isActive: pathname === `/${lang}/favorites/others`,
      badge: favorites.badgeOthersSeries as string,
    }] : []),
    ...(counts.otherVolumes > 0 ? [{
      label: favorites.sectionOthers,
      href: `/${lang}/favorites/others/volumes`,
      icon: BookCopyIcon,
      isActive: pathname === `/${lang}/favorites/others/volumes`,
      badge: favorites.badgeOthersVolumes as string,
    }] : []),
  ];
}
