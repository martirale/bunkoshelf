"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarLogo() {
  const pathname = usePathname();

  const isBooks =
    pathname.startsWith("/en/books") || pathname.startsWith("/es/books");

  const logoSrc = isBooks
    ? "/logos/BunkoShelfAsh.svg"
    : "/logos/BunkoShelfLilah.svg";

  const lang = pathname.split("/")[1] === "en" ? "en" : "es";

  return (
    <div className="px-4">
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
