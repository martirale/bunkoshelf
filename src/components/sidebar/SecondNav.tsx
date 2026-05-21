import Link from "next/link";
import { BookOpenIcon } from "lucide-react";
import type { Dictionary } from "@/lib/types";

interface SecondNavProps {
  intl: Dictionary;
  className?: string;
}

export default function SecondNav({ intl, className }: SecondNavProps) {
  const links = [
    {
      href: "https://bunko.alemartir.com",
      icon: BookOpenIcon,
      label: intl.noauth.guide as string,
      external: true,
    },
  ];

  return (
    <div className={`mt-8 md:space-y-2 ${className}`}>
      {links.map(({ href, icon: Icon, label, external }, index) => (
        <Link
          key={index}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener" : undefined}
          className="flex items-center p-4 rounded-lg leading-none border border-pearl md:border-blackamber hover:text-pearl hover:border-lilah transition-all duration-300"
        >
          <Icon size={20} className="mr-2" />
          {label}
        </Link>
      ))}
    </div>
  );
}
