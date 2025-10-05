"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MainLogo({ width = 196, height = 39 }) {
  const pathname = usePathname();
  const lang = pathname.split("/")[1] === "en" ? "en" : "es";

  return (
    <div className="px-4">
      <Link href={`/${lang}`} className="inline-block">
        <Image
          src="/logos/BunkoShelfPearl.svg"
          alt="Bunko Shelf Logo"
          width={width}
          height={height}
          priority
        />
      </Link>
    </div>
  );
}
