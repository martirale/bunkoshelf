import React from "react";
import MangaCard from "@/ui/library/manga/MangaCard";
import prisma from "@/lib/prisma";
import { sortByPaddedTitle } from "@/lib/utils";
import { LibraryBig } from "lucide-react";

export default async function LibraryGridVolumes({ lang, intl }) {
  const volumes = await prisma.mangaVolume.findMany({
    include: {
      series: true,
      metadataObj: true,
    },
  });

  const sortedVolumes = sortByPaddedTitle(volumes);
  const entries = sortedVolumes.map((vol) => ({
    ...vol,
    isOneshot: vol.series?.isOneshot === true,
    coverImage: vol.coverImage?.replace(/\\/g, "/") ?? null,
    meta: vol.metadataObj || null,
  }));

  return (
    <div className="mt-8">
      <h2 className="flex items-center mb-4 text-base md:text-lg">
        <LibraryBig className="w-6 h-6 md:w-7 md:h-7 mr-2" />
        {intl.manga.allVolumes}
      </h2>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-6">
        {entries.map((entry) => {
          const href = `/${lang}/manga/volume/${entry.slug}`;

          return (
            <MangaCard
              key={entry.title}
              title={entry.meta.title}
              href={href}
              isSeries={false}
              isOneshot={entry.isOneshot}
              volumeCount={null}
              cover={entry.coverImage}
              intl={intl}
              className="font-roboto font-bold leading-5 2xl:leading-6 text-base 2xl:text-xl"
            />
          );
        })}
      </section>
    </div>
  );
}
