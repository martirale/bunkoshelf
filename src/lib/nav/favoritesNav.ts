import type { LucideIcon } from "lucide-react";
import { BookCopyIcon, BookHeartIcon, LibraryBigIcon } from "lucide-react";
import type { Dictionary, DictionarySection } from "@/lib/types";

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
}

export function getFavoritesNavLinks({
  intl,
  lang,
  pathname,
}: GetFavoritesNavLinksParams): FavoritesNavLink[] {
  return [
    {
      label: intl.favorites.sectionMangaSeries,
      href: `/${lang}/favorites/manga`,
      icon: LibraryBigIcon,
      isActive: pathname === `/${lang}/favorites/manga`,
      badge: "M",
    },
    {
      label: intl.favorites.sectionMangaVolumes,
      href: `/${lang}/favorites/manga/volumes`,
      icon: BookCopyIcon,
      isActive: pathname === `/${lang}/favorites/manga/volumes`,
      badge: "M",
    },
    {
      label: intl.favorites.sectionOthersSeries,
      href: `/${lang}/favorites/others`,
      icon: LibraryBigIcon,
      isActive: pathname === `/${lang}/favorites/others`,
      badge: "C",
    },
    {
      label: intl.favorites.sectionOthersVolumes,
      href: `/${lang}/favorites/others/volumes`,
      icon: BookCopyIcon,
      isActive: pathname === `/${lang}/favorites/others/volumes`,
      badge: "C",
    },
    {
      label: intl.favorites.sectionBooks,
      href: `/${lang}/favorites/books`,
      icon: BookHeartIcon,
      isActive: pathname === `/${lang}/favorites/books`,
    },
  ];
}
