import Link from "next/link";
import Image from "next/image";
import { LibraryBigIcon, ChevronRightIcon } from "lucide-react";
import MangaCard from "@/components/ui/MangaCard";
import ReloadButton from "@/components/ui/ReloadButton";
import PushButton from "@/components/ui/PushButton";
import { getMangaVolumes } from "@/actions/library";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import type { DictionarySection, Locale } from "@/lib/types";

interface HeroKeepReadProps {
  lang: Locale;
  intl: DictionarySection;
  vapidPublicKey?: string;
}

export default async function HeroKeepRead({ lang, intl, vapidPublicKey }: HeroKeepReadProps) {
  const result = await getMangaVolumes();

  const entry = (() => {
    if (!result?.success || !result.data) return null;

    return (
      result.data
        .map((vol) => {
          const progress = vol.usersProgress?.[0] ?? null;
          return {
            title: vol.title,
            slug: vol.slug,
            isOneshot: vol.series?.isOneshot === true,
            coverImage: getMangaCoverUrl(vol),
            meta: vol.metadataObj ? { title: vol.metadataObj.title } : null,
            lastPage: progress?.lastPage ?? 0,
            totalPages: progress?.totalPages ?? 0,
            lastReadAt: progress?.lastReadAt ? new Date(progress.lastReadAt) : null,
          };
        })
        .filter((vol) => {
          if (!vol.lastReadAt) return false;
          const notStarted = vol.lastPage === 0;
          const alreadyFinished = vol.lastPage >= vol.totalPages - 1;
          return !notStarted && !alreadyFinished;
        })
        .sort((a, b) => (b.lastReadAt?.getTime() ?? 0) - (a.lastReadAt?.getTime() ?? 0))[0] ?? null
    );
  })();

  const libraries = intl.libraries as DictionarySection;

  return (
    <div className="flex-shrink-0 w-full md:w-1/1 2xl:w-3/5">
      <div className="flex justify-between items-center mb-4">
        <Link href={`/${lang}/manga`}>
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
            href={`/${lang}/manga/volume/${entry.slug}`}
            isSeries={false}
            isOneshot={entry.isOneshot}
            volumeCount={null}
            cover={entry.coverImage}
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
