"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import MangaCard from "@/ui/library/manga/MangaCard";
import { LibraryBig } from "lucide-react";

export default function HomeRowHeroManga({ lang, intl }) {
  const [entry, setEntry] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchReadingProgress() {
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

    fetchReadingProgress();
  }, [pathname]);

  // Extraemos segmentos para facilitar comparación
  const shouldHideHero = (() => {
    const sp = pathname.split("/");
    return (
      (sp.length === 4 &&
        sp[2] === "manga" &&
        !["series", "volumes", "volume"].includes(sp[3])) ||
      (sp.length === 5 && sp[2] === "manga" && sp[3] === "volume")
    );
  })();

  if (shouldHideHero || !entry) return null;

  const href = `/${lang}/manga/volume/${entry.slug}`;

  return (
    <div className="flex-shrink-0 w-full md:w-1/1 2xl:w-1/2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-onix flex items-center text-base md:text-lg">
          <LibraryBig className="w-6 h-6 md:w-7 md:h-7 mr-2" />
          {intl.libraries.keepReading}
        </h2>
      </div>

      <div className="w-full px-12 md:px-0">
        <MangaCard
          title={entry.meta?.title ?? entry.title}
          href={href}
          isSeries={false}
          isOneshot={entry.isOneshot}
          volumeCount={null}
          cover={entry.coverImage}
          intl={intl}
          isDragging={false}
          className="font-roboto font-bold leading-5 2xl:leading-6 text-xl 2xl:text-2xl"
        />
      </div>
    </div>
  );
}
