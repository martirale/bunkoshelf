import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function SecondNav({ intl, className }) {
  const links = [
    {
      href: "https://bunko.amlab.site/referencia/app",
      icon: BookOpen,
      label: intl.noauth.guide,
      external: true,
    },
  ];

  return (
    <div className={`mt-8 space-y-2 ${className}`}>
      {links.map(({ href, icon: Icon, label, external }, index) => (
        <Link
          key={index}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener" : undefined}
          className="flex items-center p-4 rounded-lg leading-none border border-pearl md:border-blackamber hover:text-pearl hover:border-lilah transition-all duration-300"
        >
          <Icon className="w-5 h-5 mr-2" />
          {label}
        </Link>
      ))}
    </div>
  );
}
