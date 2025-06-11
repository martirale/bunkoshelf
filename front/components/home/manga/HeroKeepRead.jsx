"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LibraryBig, ChevronRight } from "lucide-react";
import MangaCard from "@/components/ui/MangaCard";

export default function HeroKeepRead({ lang, intl }) {
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    async function fetchProgress() {
      const res = await fetch("/api/library/manga/volumes");
      const { data } = await res.json();

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
          <h2 className="text-onix flex items-center text-base md:text-lg group">
            <LibraryBig className="w-6 h-6 md:w-7 md:h-7 mr-2" />
            {intl.libraries.keepReading}
            <ChevronRight className="w-6 h-6 md:w-7 md:h-7 ml-2 text-pearl group-hover:text-onix transition-all duration-300" />
          </h2>
        </Link>
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
