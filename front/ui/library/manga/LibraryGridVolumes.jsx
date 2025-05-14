import React from "react";
import MangaCard from "./MangaCard";
import prisma from "@/lib/prisma";

export default async function LibraryGridVolumes({
  lang,
  intl,
  title,
  icon,
  className,
}) {
  const volumes = await prisma.mangaVolume.findMany({
    include: {
      series: true,
    },
    orderBy: {
      title: "asc",
    },
  });

  const entries = volumes.map((vol) => ({
    ...vol,
    isOneshot: vol.series?.isOneshot === true,
    coverImage: vol.coverImage?.replace(/\\/g, "/") ?? null,
  }));

  return (
    <div className={`relative ${className}`}>
      <h2 className="flex items-center mb-4">
        {icon && React.cloneElement(icon, { className: "w-7 h-7 mr-2" })}
        {title}
      </h2>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {entries.map((entry) => {
          const href = `/${lang}/manga/volume/${entry.slug}`;

          return (
            <MangaCard
              key={entry.title}
              title={entry.title}
              href={href}
              isSeries={false}
              isOneshot={entry.isOneshot}
              volumeCount={null}
              cover={entry.coverImage}
              intl={intl}
              className="text-xs leading-6 2xl:text-sm 2xl:leading-6.5"
            />
          );
        })}
      </section>
    </div>
  );
}
