import Link from "next/link";
import Image from "next/image";
import { LibraryBigIcon, ChevronRightIcon } from "lucide-react";
import MangaCard from "@/components/ui/MangaCard";
import ReloadButton from "@/components/ui/ReloadButton";
import PushButton from "@/components/ui/PushButton";
import {
  getLibraryRootHref,
  type LibrarySection,
} from "@/lib/librarySection";
import type { DictionarySection, Locale } from "@/lib/types";

export interface HomeKeepReadingEntry {
  title: string;
  slug: string;
  isOneshot: boolean;
  coverImage: string | null;
  section: LibrarySection;
  meta: { title?: string | null } | null;
  lastPage: number;
  totalPages: number;
}

interface HeroKeepReadProps {
  lang: Locale;
  intl: DictionarySection;
  vapidPublicKey?: string;
  entry: HomeKeepReadingEntry | null;
}

export default async function HeroKeepRead({
  lang,
  intl,
  vapidPublicKey,
  entry,
}: HeroKeepReadProps) {
  const libraries = intl.libraries as DictionarySection;

  return (
    <div className="flex-shrink-0 w-full md:w-1/1 2xl:w-3/5">
      <div className="flex justify-between items-center mb-4">
        <Link href={getLibraryRootHref(lang, entry?.section ?? "manga")}>
          <h2 className="text-onix flex items-center text-base md:text-lg">
            <LibraryBigIcon size={28} className="mr-2" />
            {libraries.keepReading as string}
            <ChevronRightIcon
              size={28}
              className="ml-1 text-onix hover:scale-110 transition-all duration-150"
            />
          </h2>
        </Link>

        <div className="flex md:hidden gap-2">
          <PushButton lang={lang} intl={intl} vapidPublicKey={vapidPublicKey} />
          <ReloadButton />
        </div>
      </div>

      <div className="w-full px-12 md:px-0">
        {entry ? (
          <MangaCard
            title={entry.meta?.title ?? entry.title}
            href={`/${lang}/${entry.section}/volume/${entry.slug}`}
            isSeries={false}
            isOneshot={entry.isOneshot}
            volumeCount={null}
            cover={entry.coverImage}
            progressRatio={
              entry.totalPages > 0 ? (entry.lastPage + 1) / entry.totalPages : 0
            }
            intl={intl}
            isDragging={false}
            className="font-roboto font-bold leading-5 2xl:leading-6 text-xl 2xl:text-2xl"
          />
        ) : (
          <div className="flex justify-center items-center">
            <Image
              src="/placeholder-v.svg"
              alt="No hay lectura activa"
              width={460}
              height={785}
              className="object-contain rounded-lg"
              priority
            />
          </div>
        )}
      </div>
    </div>
  );
}
