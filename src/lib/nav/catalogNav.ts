import type { LucideIcon } from "lucide-react";
import {
  DramaIcon,
  LibraryBigIcon,
  TagsIcon,
  UserRoundPenIcon,
} from "lucide-react";
import type { Dictionary } from "@/lib/types";

export interface CatalogNavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
}

interface GetCatalogNavLinksParams {
  intl: Dictionary;
  lang: string;
  pathname: string;
}

export function getCatalogNavLinks({
  intl,
  lang,
  pathname,
}: GetCatalogNavLinksParams): CatalogNavLink[] {
  return [
    {
      label: intl.catalog.library as string,
      href: `/${lang}/catalog/library`,
      icon: LibraryBigIcon,
      isActive: pathname === `/${lang}/catalog/library`,
    },
    {
      label: intl.catalog.authors as string,
      href: `/${lang}/catalog/authors`,
      icon: UserRoundPenIcon,
      isActive: pathname === `/${lang}/catalog/authors`,
    },
    {
      label: intl.catalog.genres as string,
      href: `/${lang}/catalog/genres`,
      icon: DramaIcon,
      isActive: pathname === `/${lang}/catalog/genres`,
    },
    {
      label: intl.catalog.tags as string,
      href: `/${lang}/catalog/tags`,
      icon: TagsIcon,
      isActive: pathname === `/${lang}/catalog/tags`,
    },
  ];
}
