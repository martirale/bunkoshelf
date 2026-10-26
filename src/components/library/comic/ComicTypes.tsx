import Link from "next/link";
import type { Dictionary, DictionarySection, Locale } from "@/lib/types";

interface ComicTypesProps {
  intl: Dictionary;
  lang: Locale;
}

export default function ComicTypes({ intl, lang }: ComicTypesProps) {
  const types = [
    { key: "comic", tag: lang === "es" ? "cómic" : "comic" },
    { key: "graphicNovel", tag: lang === "es" ? "novela gráfica" : "graphic novel" },
    { key: "manhwa", tag: "manhwa" },
    { key: "manhua", tag: "manhua" },
  ];
  const labels = intl.libraries.comicTypes as DictionarySection;

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
      {types.map((type) => (
        <Link
          key={type.key}
          href={{
            pathname: `/${lang}/comic/series`,
            query: { tag: type.tag, includeOneshots: "true" },
          }}
          className="h-[110px] rounded-lg bg-pearl p-4 2xl:px-4 2xl:pb-5 flex flex-col justify-between group"
        >
          <span className="text-onix text-sm uppercase">
            {labels.type as string}
          </span>
          <p className="text-onix 2xl:text-2xl font-boldonse leading-7.5 mt-2 flex items-center group-hover:text-lilah transition-all duration-300">
            {labels[type.key] as string}
          </p>
        </Link>
      ))}
    </section>
  );
}
