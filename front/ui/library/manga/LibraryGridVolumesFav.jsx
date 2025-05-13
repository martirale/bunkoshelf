import MangaCard from "./MangaCard";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export default async function LibraryGridVolumesFav({ lang, intl }) {
  const user = await verifySession();
  if (!user) return null;

  const favorites = await prisma.userToVolume.findMany({
    where: {
      userId: user.id,
      isFavorite: true,
    },
    include: {
      volume: true,
    },
  });

  const entries = favorites.map(({ volume }) => ({
    ...volume,
    coverImage: volume.coverImage?.replace(/\\/g, "/") ?? null,
  }));

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
      {entries.map((entry) => {
        const href = `/${lang}/manga/volume/${entry.slug}`;
        const coverImage = entry.coverImage;

        return (
          <MangaCard
            key={entry.title}
            title={entry.title}
            href={href}
            isSeries={false}
            isOneshot={true}
            volumeCount={null}
            cover={coverImage}
            intl={intl}
            className="text-xs leading-6 2xl:text-sm 2xl:leading-6.5"
          />
        );
      })}
    </div>
  );
}
