"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import clsx from "clsx";
import MobileSecondaryNav from "@/components/ui/MobileSecondaryNav";
import { getProfileNavLinks } from "@/lib/nav/profileNav";
import type { DictionarySection } from "@/lib/types";

interface ProfileNavProps {
  intl: DictionarySection;
}

export default function ProfileNav({ intl }: ProfileNavProps) {
  const params = useParams();
  const pathname = usePathname();
  const currentLang = (params.lang as string) || "es";
  const links = getProfileNavLinks({ intl, lang: currentLang, pathname });

  return (
    <div className="mt-4 md:mt-16">
      <MobileSecondaryNav items={links.map((link) => ({
        ...link,
        label: String(link.label),
      }))} />

      <div className={clsx("hidden md:space-y-2 md:block")}>
        {links.map(({ href, icon: Icon, label, isActive }, index) => (
          <Link
            key={index}
            href={href}
            className={clsx(
              "flex flex-row justify-start w-full items-center p-4 rounded-lg leading-none text-onix transition-all duration-300",
              isActive ? "bg-sand" : "hover:bg-sand"
            )}
          >
            <Icon size={20} className="mr-2" />
            <span>{label as string}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
