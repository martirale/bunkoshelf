import type { LucideIcon } from "lucide-react";
import {
  BookOpenIcon,
  LanguagesIcon,
  LogOutIcon,
  Settings2Icon,
} from "lucide-react";
import type { Dictionary, Session } from "@/lib/types";

export type FooterButton =
  | {
      type: "link";
      icon: LucideIcon;
      href: string;
      target: string;
      title: string;
    }
  | {
      type: "button";
      icon: LucideIcon;
      title: string;
      onClick: () => void;
    };

interface GetFooterButtonsParams {
  intl: Dictionary;
  lang: string;
  user: Session | null;
  isLoggedIn: boolean;
  onToggleLang: () => void;
  onLogout: () => void;
}

export function getFooterButtons({
  intl,
  lang,
  user,
  isLoggedIn,
  onToggleLang,
  onLogout,
}: GetFooterButtonsParams): FooterButton[] {
  return [
    {
      type: "link",
      icon: BookOpenIcon,
      href: "https://bunko.alemartir.com/guides/manga",
      target: "_blank",
      title: intl.tooltip.userGuide as string,
    },
    {
      type: "button",
      icon: LanguagesIcon,
      title: intl.tooltip.switchLang as string,
      onClick: onToggleLang,
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
    ...(isLoggedIn
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
}
