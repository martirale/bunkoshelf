"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarLogo() {
  const pathname = usePathname();

  const isBooks = pathname.startsWith("/books");

  const logoSrc = isBooks
    ? "/logos/BunkoShelfDenim.svg"
    : "/logos/BunkoShelfLilah.svg";

  return (
    <div className="mt-2 px-4">
      <Link href="/" className="inline-block">
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
