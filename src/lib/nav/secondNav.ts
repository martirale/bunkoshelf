import { BookOpenIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Dictionary } from "@/lib/types";

export interface SecondNavLink {
  href: string;
  icon: LucideIcon;
  label: string;
  external?: boolean;
}

export function getSecondNavLinks(intl: Dictionary): SecondNavLink[] {
  return [
    {
      href: "https://bunko.alemartir.com",
      icon: BookOpenIcon,
      label: intl.noauth.guide as string,
      external: true,
    },
  ];
}
