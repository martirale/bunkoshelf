"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  HomeIcon as House,
  LibraryBigIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HeartIcon,
  UserRoundIcon,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { usePathname, useParams } from "next/navigation";
import clsx from "clsx";
import { requireRole, ROLES } from "@/lib/auth/roles";
import type { Dictionary, Session, Role } from "@/lib/types";

interface SubItem {
  label: string;
  href: string;
  isActive: boolean;
}

interface NavLink {
  label: string;
  href?: string;
  icon: LucideIcon;
  isActive: boolean;
  minRole: Role;
  isDropdown?: boolean;
  subItems?: SubItem[];
}

interface MainNavProps {
  intl: Dictionary;
  user: Session;
}

export default function MainNav({ intl, user }: MainNavProps) {
  const params = useParams();
  const currentLang = (params.lang as string) || "es";
  const pathname = usePathname();

  const isLibraryActive =
    pathname.startsWith(`/${currentLang}/manga`) ||
    pathname.startsWith(`/${currentLang}/books`);

  const [openLibraryMenu, setOpenLibraryMenu] = useState(false);
  const hasManuallyToggled = useRef(false);

  useEffect(() => {
    if (isLibraryActive && !hasManuallyToggled.current) {
      setOpenLibraryMenu(true);
    }

    if (!isLibraryActive) {
      setOpenLibraryMenu(false);
      hasManuallyToggled.current = false;
    }
  }, [pathname]);

  const handleToggleLibrary = () => {
    setOpenLibraryMenu((prev) => !prev);
    hasManuallyToggled.current = true;
  };

  const links: NavLink[] = [
    {
      label: intl.sidebar.home as string,
      href: `/${currentLang}`,
      icon: House,
      isActive: pathname === `/${currentLang}`,
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
          href: `/${currentLang}/manga`,
          isActive: pathname.startsWith(`/${currentLang}/manga`),
        },
        {
          label: intl.sidebar.books as string,
          href: `/${currentLang}/books`,
          isActive: pathname.startsWith(`/${currentLang}/books`),
        },
      ],
    },
    {
      label: intl.sidebar.favorites as string,
      href: `/${currentLang}/favorites`,
      icon: HeartIcon,
      isActive: pathname.startsWith(`/${currentLang}/favorites`),
      minRole: ROLES.MEMBER,
    },
    {
      label: intl.sidebar.profile as string,
      href: `/${currentLang}/profile`,
      icon: UserRoundIcon,
      isActive: pathname.startsWith(`/${currentLang}/profile`),
      minRole: ROLES.MEMBER,
    },
  ].filter((link) => requireRole(user, link.minRole));

  return (
    <nav className="mt-8 space-y-2">
      {links.map((link) => {
        if (link.isDropdown) {
          return (
            <div key={link.label} className="relative">
              <button
                onClick={handleToggleLibrary}
                className={clsx(
                  "w-full flex items-center justify-between p-4 rounded-lg leading-none cursor-pointer border hover:border-lilah transition-all duration-300",
                  link.isActive
                    ? "text-onix bg-sand md:text-sand md:bg-onix md:border-pearl"
                    : "border-pearl md:border-blackamber hover:text-pearl hover:border-lilah"
                )}
              >
                <span className="flex items-center">
                  <link.icon size={20} className="mr-2" />
                  {link.label}
                </span>
                {openLibraryMenu ? (
                  <ChevronUpIcon size={20} className="ml-2" />
                ) : (
                  <ChevronDownIcon size={20} className="ml-2" />
                )}
              </button>

              {openLibraryMenu && (
                <div className="mt-2 space-y-2">
                  {link.subItems?.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={clsx(
                        "block pl-12 pr-4 py-4 rounded-lg leading-none transition-all duration-300",
                        subItem.isActive
                          ? "bg-sand text-onix md:bg-onix md:text-sand"
                          : "hover:bg-onix hover:text-pearl"
                      )}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href!}
            className={clsx(
              "flex items-center p-4 rounded-lg leading-none border transition-all duration-300",
              link.isActive
                ? "border-onix bg-sand text-onix md:border-sand md:bg-onix md:text-sand hover:border-lilah"
                : "border-pearl md:border-blackamber hover:text-pearl hover:border-lilah"
            )}
          >
            <link.icon size={20} className="mr-2" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
