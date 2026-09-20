import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, ListIcon } from "lucide-react";

interface DetailNavigationLink {
  href: string;
  label: string;
}

interface DetailNavigationProps {
  allSeries?: DetailNavigationLink;
  allVolumes?: DetailNavigationLink;
  previous?: DetailNavigationLink;
  next?: DetailNavigationLink;
}

const linkClassName = "flex w-fit items-center gap-1 text-sm uppercase text-sand underline";

export default function DetailNavigation({ allSeries, allVolumes, previous, next }: DetailNavigationProps) {
  if (allSeries || allVolumes) {
    const link = allSeries ?? allVolumes!;

    return (
      <nav className="mt-2 hidden md:block">
        <Link href={link.href} className={linkClassName}>
          <ListIcon size={16} />
          {link.label}
        </Link>
      </nav>
    );
  }

  if (!previous && !next) return null;

  return (
    <nav className="mt-2 hidden md:flex w-full items-center justify-between gap-2">
      {previous ? (
        <Link href={previous.href} className={linkClassName}>
          <ChevronLeftIcon size={16} />
          {previous.label}
        </Link>
      ) : <span />}
      {next ? (
        <Link href={next.href} className={linkClassName}>
          {next.label}
          <ChevronRightIcon size={16} />
        </Link>
      ) : <span />}
    </nav>
  );
}
