import Link from "next/link";
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
  const demographics = [
    { id: 1, name: "Shōnen", link: `/${section}/volumes?tag=shonen` },
    { id: 2, name: "Shōjo", link: `/${section}/volumes?tag=shojo` },
    { id: 3, name: "Seinen", link: `/${section}/volumes?tag=seinen` },
    { id: 4, name: "Josei", link: `/${section}/volumes?tag=josei` },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
      {demographics.map((demo) => (
        <Link
          key={demo.id}
          href={`/${lang}${demo.link}`}
          className="h-[110px] rounded-lg bg-pearl p-4 2xl:px-4 2xl:pb-5 flex flex-col justify-between group"
        >
          <span className="text-onix text-sm uppercase">
            {intl.libraries.manga as string}
          </span>
          <p className="text-onix 2xl:text-2xl font-boldonse leading-7.5 mt-2 flex items-center group-hover:text-lilah transition-all duration-300">
            {demo.name}
          </p>
        </Link>
      ))}
    </section>
  );
}
