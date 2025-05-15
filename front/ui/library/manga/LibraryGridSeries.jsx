import React from "react";
import MangaCard from "./MangaCard";
import prisma from "@/lib/prisma";

export default async function LibraryGridSeries({
  lang,
  intl,
  title,
  icon,
  className,
}) {
  const series = await prisma.mangaSeries.findMany({
    include: {
      volumes: true,
    },
    orderBy: {
      title: "asc",
    },
  });

  const entries = series
    .filter(
      (entry) => (entry.volumes && entry.volumes.length > 1) || entry.metadata
    )
    .map((entry) => ({
      ...entry,
      coverImage: entry.volumes?.[0]?.coverImage?.replace(/\\/g, "/") ?? null,
      volumes:
        entry.volumes?.map((vol) => ({
          ...vol,
          coverImage: vol.coverImage?.replace(/\\/g, "/") ?? null,
        })) ?? [],
    }));

  return (
    <div className={`relative ${className}`}>
      <h2 className="flex items-center mb-4">
        {icon && React.cloneElement(icon, { className: "w-7 h-7 mr-2" })}
        {title}
      </h2>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-5 2xl:grid-cols-6">
        {entries.map((entry) => {
          const isSeries =
            (entry.volumes && entry.volumes.length > 1) || entry.metadata;
          const isOneshot = !isSeries;

          const href = isOneshot
            ? `/${lang}/manga/volume/${entry.volumeSlug}`
            : `/${lang}/manga/${entry.slug}`;

          const coverImage = entry.coverImage;

          return (
            <MangaCard
              key={entry.title}
              title={entry.title}
              href={href}
              isSeries={isSeries}
              isOneshot={isOneshot}
              volumeCount={isSeries ? entry.volumes.length : null}
              cover={coverImage}
              intl={intl}
              className="font-roboto font-bold leading-5 2xl:leading-6 text-base 2xl:text-xl"
            />
          );
        })}
      </section>
    </div>
  );
}
