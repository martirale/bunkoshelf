import type { LucideIcon } from "lucide-react";
import { FolderCogIcon, LayoutPanelTopIcon, ShieldCheckIcon } from "lucide-react";
import type { Dictionary } from "@/lib/types";

export interface SettingsNavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
}

interface GetSettingsNavLinksParams {
  intl: Dictionary;
  lang: string;
  pathname: string;
  hash: string;
}

export function getSettingsNavLinks({
  intl,
  lang,
  pathname,
  hash,
}: GetSettingsNavLinksParams): SettingsNavLink[] {
  return [
    {
      label: intl.settings.overview as string,
      href: `/${lang}/settings#overview`,
      icon: LayoutPanelTopIcon,
      isActive: pathname === `/${lang}/settings` && (hash === "#overview" || hash === ""),
    },
    {
      label: intl.settings.library as string,
      href: `/${lang}/settings/library`,
      icon: FolderCogIcon,
      isActive: pathname.startsWith(`/${lang}/settings/library`),
    },
    {
      label: intl.settings.parentalControl as string,
      href: `/${lang}/settings/parental-control`,
      icon: ShieldCheckIcon,
      isActive: pathname.startsWith(`/${lang}/settings/parental-control`),
    },
  ];
}
