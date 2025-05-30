import { LibraryBig } from "lucide-react";
import MangaCard from "@/ui/library/manga/MangaCard";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/verifySession";
import { sortByPaddedTitle } from "@/lib/utils";

export default async function HeroKeepRead({ lang, intl }) {
  const currentUser = await verifySession();

  if (!currentUser) return null;

  let volumes = await prisma.mangaVolume.findMany({
    include: {
      series: true,
      metadataObj: true,
      usersProgress: {
        where: {
          userId: currentUser.id,
        },
      },
    },
  });

  volumes = sortByPaddedTitle(volumes);

  const entry =
    volumes
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
      .sort((a, b) => b.lastReadAt - a.lastReadAt)[0] ?? null;

  if (!entry) return null;

  const href = `/${lang}/manga/volume/${entry.slug}`;

  return (
    <div className="flex-shrink-0 w-full md:w-1/1 2xl:w-3/5">
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
