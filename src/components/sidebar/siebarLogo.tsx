"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarLogoProps {
  className?: string;
}

export default function SidebarLogo({ className }: SidebarLogoProps) {
  const pathname = usePathname();
  const lang = pathname.split("/")[1] === "en" ? "en" : "es";

  return (
    <div className={className ?? "px-4"}>
      <Link href={`/${lang}`} className="inline-block">
        <Image
          src="/logos/BunkoShelfPearl.svg"
          alt="Bunko Shelf Logo"
          width={181}
          height={36}
          priority
        />
      </Link>
    </div>
  );
}
