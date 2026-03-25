"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobNavLogoProps {
  width?: number;
  height?: number;
}

export default function MobNavLogo({
  width = 196,
  height = 39,
}: MobNavLogoProps) {
  const pathname = usePathname();
  const lang = pathname.split("/")[1] === "en" ? "en" : "es";

  return (
    <Link href={`/${lang}`} className="inline-block">
      <Image
        src="/logos/BunkoShelfOnix.svg"
        alt="Bunko Shelf Logo"
        width={width}
        height={height}
        priority
      />
    </Link>
  );
}
