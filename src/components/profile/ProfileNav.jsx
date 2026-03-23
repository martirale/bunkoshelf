"use client";

import Link from "next/link";
import { LayoutPanelTopIcon, UserRoundPenIcon } from "lucide-react";
import { usePathname, useParams } from "next/navigation";
import clsx from "clsx";

export default function ProfileNav({ intl }) {
  const params = useParams();
  const pathname = usePathname();
  const currentLang = params.lang || "es";

  const links = [
    {
      label: intl.profile.overview,
      href: `/${currentLang}/profile`,
      icon: LayoutPanelTopIcon,
      isActive: pathname === `/${currentLang}/profile`,
    },
    {
      label: intl.profile.updateProfile,
      href: `/${currentLang}/profile/update`,
      icon: UserRoundPenIcon,
      isActive: pathname === `/${currentLang}/profile/update`,
    },
  ];

  return (
    <div className="mt-4 md:mt-16">
      <div className={clsx("md:space-y-2", "flex md:block gap-2")}>
        {links.map(({ href, icon: Icon, label, isActive }, index) => (
          <Link
            key={index}
            href={href}
            className={clsx(
              "flex flex-col md:flex-row justify-center md:justify-start w-full items-center p-4 rounded-lg leading-none text-onix transition-all duration-300",
              isActive ? "bg-sand" : "hover:bg-sand"
            )}
          >
            <Icon size={20} className="mr-1 md:mr-2" />
            <span className="hidden md:inline">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
