import Link from "next/link";
import { mangaDemographics } from "@/lib/libraryFilters";
import type { LibrarySection } from "@/lib/librarySection";
import type { Locale, Dictionary } from "@/lib/types";

interface DemographicsTilesProps {
  intl: Dictionary;
  lang: Locale;
  section?: LibrarySection;
}

export default function DemographicsTiles({
  intl,
  lang,
  section = "manga",
}: DemographicsTilesProps) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
      {mangaDemographics.map(({ tag, label }) => (
        <Link
          key={tag}
          href={`/${lang}/${section}/series?tag=${tag}&includeOneshots=true`}
          className="h-[110px] rounded-lg bg-pearl p-4 2xl:px-4 2xl:pb-5 flex flex-col justify-between group"
        >
          <span className="text-onix text-sm uppercase">
            {intl.libraries.manga as string}
          </span>
          <p className="text-onix 2xl:text-2xl font-boldonse leading-7.5 mt-2 flex items-center group-hover:text-lilah transition-all duration-300">
            {label}
          </p>
        </Link>
      ))}
    </section>
  );
}
