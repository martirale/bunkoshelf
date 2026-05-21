import type { LucideIcon } from "lucide-react";
import {
  BellIcon,
  LayoutPanelTopIcon,
  UserRoundPenIcon,
} from "lucide-react";
import type { DictionarySection } from "@/lib/types";

export interface ProfileNavLink {
  label: string | DictionarySection;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
}

interface GetProfileNavLinksParams {
  intl: DictionarySection;
  lang: string;
  pathname: string;
}

export function getProfileNavLinks({
  intl,
  lang,
  pathname,
}: GetProfileNavLinksParams): ProfileNavLink[] {
  const profile = intl.profile as DictionarySection;

  return [
    {
      label: profile.overview as string,
      href: `/${lang}/profile`,
      icon: LayoutPanelTopIcon,
      isActive: pathname === `/${lang}/profile`,
    },
    {
      label: profile.updateProfile as string,
      href: `/${lang}/profile/update`,
      icon: UserRoundPenIcon,
      isActive: pathname === `/${lang}/profile/update`,
    },
    {
      label: profile.notifications as string,
      href: `/${lang}/profile/notifications`,
      icon: BellIcon,
      isActive: pathname === `/${lang}/profile/notifications`,
    },
  ];
}
