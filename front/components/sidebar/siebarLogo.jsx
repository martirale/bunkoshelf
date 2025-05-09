"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarLogo({ className }) {
  const pathname = usePathname();

  const isManga =
    pathname.startsWith("/es/manga") || pathname.startsWith("/en/manga");
  const isBooks =
    pathname.startsWith("/es/books") || pathname.startsWith("/en/books");

  const logoSrc = isManga
    ? "/logos/BunkoShelfLilah.svg"
    : isBooks
    ? "/logos/BunkoShelfAsh.svg"
    : "/logos/BunkoShelfPearl.svg";

  const lang = pathname.split("/")[1] === "en" ? "en" : "es";

  return (
    <div className={`px-4 ${className}`}>
      <Link href={`/${lang}`} className="inline-block">
        <Image
          src={logoSrc}
          alt="Bunko Shelf Logo"
          width={196}
          height={39}
          priority
        />
      </Link>
    </div>
  );
}
