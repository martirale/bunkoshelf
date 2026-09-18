import type { LucideIcon } from "lucide-react";
import {
  UserRoundIcon,
  BookOpenIcon,
  LanguagesIcon,
  LogOutIcon,
  Settings2Icon,
} from "lucide-react";
import { requireRole, ROLES } from "@/lib/auth/roles";
import type { Dictionary, Role, Session } from "@/lib/types";

export type FooterButton =
  | {
      type: "link";
      icon: LucideIcon;
      href: string;
      target: string;
      title: string;
      minRole?: Role;
    }
  | {
      type: "button";
      icon: LucideIcon;
      title: string;
      onClick: () => void;
      minRole?: Role;
    };

interface GetFooterButtonsParams {
  intl: Dictionary;
  lang: string;
  user: Session | null;
  isLoggedIn: boolean;
  showLogout?: boolean;
  onToggleLang: () => void;
  onLogout: () => void;
}

export function getFooterButtons({
  intl,
  lang,
  user,
  isLoggedIn,
  showLogout = true,
  onToggleLang,
  onLogout,
}: GetFooterButtonsParams): FooterButton[] {
  const buttons: FooterButton[] = [
    {
      type: "link",
      icon: UserRoundIcon,
      href: `/${lang}/profile`,
      target: "_self",
      title: intl.sidebar.profile as string,
      minRole: ROLES.MEMBER,
    },
    {
      type: "button",
      icon: LanguagesIcon,
      title: intl.tooltip.switchLang as string,
      onClick: onToggleLang,
    },
    {
      type: "link",
      icon: BookOpenIcon,
      href: "https://bunko.alemartir.com/guides/manga",
      target: "_blank",
      title: intl.tooltip.userGuide as string,
    },
    ...(user?.isAdmin
      ? [
          {
            type: "link" as const,
            icon: Settings2Icon,
            href: `/${lang}/settings`,
            target: "_self",
            title: intl.tooltip.settings as string,
          },
        ]
      : []),
    ...(isLoggedIn && showLogout
      ? [
          {
            type: "button" as const,
            icon: LogOutIcon,
            title: intl.tooltip.logout as string,
            onClick: onLogout,
          },
        ]
      : []),
  ];

  return buttons.filter((button) => !button.minRole || requireRole(user, button.minRole));
}
