"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LibraryBigIcon, ChevronRightIcon } from "lucide-react";
import MangaCard from "@/components/ui/MangaCard";
import ReloadButton from "@/components/ui/ReloadButton";
import PushButton from "@/components/ui/PushButton";
import { getMangaVolumes } from "@/actions/library";

export default function HeroKeepRead({ lang, intl }) {
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    async function fetchProgress() {
      const result = await getMangaVolumes();
      if (!result.success) return;

      const data = result.data;

      const filtered = data
        .map((vol) => {
          const progress = vol.usersProgress?.[0] || null;

          return {
            ...vol,
            isOneshot: vol.series?.isOneshot === true,
            coverImage: vol.coverImage
              ? `/api/library/manga/cover${vol.coverImage
                  .replace(/\\/g, "/")
                  .replace(/^\/?covers/, "")}`
              : null,
            meta: vol.metadataObj || null,
            lastPage: progress?.lastPage ?? 0,
            totalPages: progress?.totalPages ?? 0,
            lastReadAt: progress?.lastReadAt
              ? new Date(progress.lastReadAt)
              : null,
          };
        })
        .filter((vol) => {
          if (!vol.lastReadAt) return false;
          const notStarted = vol.lastPage === 0;
          const alreadyFinished = vol.lastPage >= vol.totalPages - 1;
          return !notStarted && !alreadyFinished;
        })
        .sort((a, b) => b.lastReadAt - a.lastReadAt);

      setEntry(filtered[0] ?? null);
    }

    fetchProgress();
  }, []);

  return (
    <div className="flex-shrink-0 w-full md:w-1/1 2xl:w-3/5">
      <div className="flex justify-between items-center mb-4">
        <Link href={`/${lang}/manga`}>
          <h2 className="text-onix flex items-center text-base md:text-lg">
            <LibraryBigIcon size={28} className="mr-2" />
            {intl.libraries.keepReading}
            <ChevronRightIcon
              size={28}
              className="ml-1 text-onix hover:scale-110 transition-all duration-150"
            />
          </h2>
        </Link>

        <div className="flex md:hidden gap-2">
          <PushButton lang={lang} intl={intl} />
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
