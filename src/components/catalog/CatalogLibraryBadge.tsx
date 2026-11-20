import Link from "next/link";
import type { OneshotSection } from "@/lib/librarySection";

const sectionStyles: Record<OneshotSection, string> = {
  manga: "bg-pearl text-onix",
  comic: "bg-neutral-700",
  books: "border border-pearl",
  others: "bg-neutral-700",
};

interface CatalogLibraryBadgeProps {
  section: OneshotSection;
  label: string;
  href?: string;
}

export default function CatalogLibraryBadge({ section, label, href }: CatalogLibraryBadgeProps) {
  const className = `${sectionStyles[section]} px-2 rounded-full text-xs uppercase`;

  return href ? (
    <Link href={href} className={`${className} transition-opacity hover:opacity-80`}>
      {label}
    </Link>
  ) : (
    <span className={className}>{label}</span>
  );
}
