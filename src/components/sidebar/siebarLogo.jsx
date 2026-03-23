"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarLogo({ className }) {
  const pathname = usePathname();
  const lang = pathname.split("/")[1] === "en" ? "en" : "es";

  return (
    <div className={`px-4 ${className}`}>
      <Link href={`/${lang}`} className="inline-block">
        <Image
          src="/logos/BunkoShelfPearl.svg"
          alt="Bunko Shelf Logo"
          width={196}
          height={39}
          priority
        />
      </Link>
    </div>
  );
}
