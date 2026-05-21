import type { LucideIcon } from "lucide-react";
import {
  HeartIcon,
  HomeIcon as House,
  LibraryBigIcon,
  UserRoundIcon,
  BookAIcon,
} from "lucide-react";
import { requireRole, ROLES } from "@/lib/auth/roles";
import type { Dictionary, Role, Session } from "@/lib/types";

interface MainNavSubItem {
  label: string;
  href: string;
  isActive: boolean;
}

export interface MainNavLink {
  label: string;
  href?: string;
  icon: LucideIcon;
  isActive: boolean;
  minRole: Role;
  isDropdown?: boolean;
  subItems?: MainNavSubItem[];
}

interface GetMainNavLinksParams {
  intl: Dictionary;
  user: Session;
  lang: string;
  pathname: string;
}

export function getMainNavLinks({
  intl,
  user,
  lang,
  pathname,
}: GetMainNavLinksParams): MainNavLink[] {
  const isLibraryActive =
    pathname.startsWith(`/${lang}/manga`) ||
    pathname.startsWith(`/${lang}/others`) ||
    pathname.startsWith(`/${lang}/books`);

  return [
    {
      label: intl.sidebar.home as string,
      href: `/${lang}`,
      icon: House,
      isActive: pathname === `/${lang}`,
      minRole: ROLES.MEMBER,
    },
    {
      label: intl.sidebar.library as string,
      icon: LibraryBigIcon,
      isDropdown: true,
      isActive: isLibraryActive,
      minRole: ROLES.MEMBER,
      subItems: [
        {
          label: intl.sidebar.manga as string,
          href: `/${lang}/manga`,
          isActive: pathname.startsWith(`/${lang}/manga`),
        },
        {
          label: intl.sidebar.others as string,
          href: `/${lang}/others`,
          isActive: pathname.startsWith(`/${lang}/others`),
        },
        {
          label: intl.sidebar.books as string,
          href: `/${lang}/books`,
          isActive: pathname.startsWith(`/${lang}/books`),
        },
      ],
    },
    {
      label: intl.sidebar.favorites as string,
      href: `/${lang}/favorites`,
      icon: HeartIcon,
      isActive: pathname.startsWith(`/${lang}/favorites`),
      minRole: ROLES.MEMBER,
    },
    {
      label: intl.sidebar.catalog as string,
      href: `/${lang}/catalog`,
      icon: BookAIcon,
      isActive: pathname.startsWith(`/${lang}/catalog`),
      minRole: ROLES.MEMBER,
    },
    {
      label: intl.sidebar.profile as string,
      href: `/${lang}/profile`,
      icon: UserRoundIcon,
      isActive: pathname.startsWith(`/${lang}/profile`),
      minRole: ROLES.MEMBER,
    },
  ].filter((link) => requireRole(user, link.minRole));
}
