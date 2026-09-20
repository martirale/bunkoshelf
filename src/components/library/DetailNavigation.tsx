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
      <nav className="mt-2 flex justify-center md:justify-start">
        <Link href={link.href} className={linkClassName}>
          <ListIcon size={16} />
          {link.label}
        </Link>
      </nav>
    );
  }

  if (!previous && !next) return null;

  return (
    <>
      <nav className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between md:hidden">
        {previous ? (
          <Link href={previous.href} aria-label={previous.label} className="p-2 text-sand">
            <ChevronLeftIcon size={32} />
          </Link>
        ) : <span />}
        {next ? (
          <Link href={next.href} aria-label={next.label} className="p-2 text-sand">
            <ChevronRightIcon size={32} />
          </Link>
        ) : <span />}
      </nav>
      <nav className="mt-2 hidden w-full items-center justify-between gap-2 md:flex">
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
    </>
  );
}
