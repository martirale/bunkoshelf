import VolumesContent from "@/components/library/manga/VolumesContent";
import { verifySession } from "@/lib/auth/verifySession";
import { getDictionary } from "@/lib/i18n/Dictionary";
import prisma from "@/lib/prisma";

export default async function VolumeMangaPage({ params }) {
  const { lang = "es", slug } = await params;
  const intl = await getDictionary(lang);

  try {
    const user = await verifySession();

    const volumeEntry = await prisma.mangaVolume.findUnique({
      where: {
        slug,
      },
      include: {
        series: true,
        metadataObj: true,
        genres: {
          include: {
            genre: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!volumeEntry) {
      return (
        <div className="text-center mt-8">
          {intl?.errors?.notFound || "Volumen no encontrado."}
        </div>
      );
    }

    const meta = {
      ...(volumeEntry.metadataObj || null),
      genres: Array.isArray(volumeEntry.genres)
        ? volumeEntry.genres
            .map((g) => (g.genre?.name ? { name: g.genre.name.trim() } : null))
            .filter(Boolean)
        : [],
      tags: Array.isArray(volumeEntry.tags)
        ? volumeEntry.tags
            .map((t) => (t.tag?.name ? { name: t.tag.name.trim() } : null))
            .filter(Boolean)
        : [],
    };

    // Normalizar la portada
    const normalizedVolume = {
      ...volumeEntry,
      coverImage: volumeEntry.coverImage
        ? `/api/library/manga/cover/${volumeEntry.slug}/${volumeEntry.coverImage}`
        : null,
      meta,
    };

    let isFavorite = false;
    let isRead = false;
    let firstRead = null;

    if (user) {
      const userVolume = await prisma.userToVolume.findUnique({
        where: {
          userId_volumeId: {
            userId: user.id,
            volumeId: volumeEntry.id,
          },
        },
        select: { isFavorite: true, isRead: true, firstRead: true },
      });

      isFavorite = userVolume?.isFavorite ?? false;
      isRead = userVolume?.isRead ?? false;
      firstRead = userVolume?.firstRead ?? null;
    }

    let readingEntries = [];

    if (user) {
      readingEntries = await prisma.readingEntry.findMany({
        where: {
          userId: user.id,
          volumeId: volumeEntry.id,
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, readAt: true },
      });
    }

    return (
      <>
        <VolumesContent
          volumeData={normalizedVolume}
          lang={lang}
          intl={intl}
          isFavorite={isFavorite}
          isRead={isRead}
          user={user}
          readingEntries={readingEntries}
          firstRead={firstRead}
        />
      </>
    );
  } catch (error) {
    console.error("Error al obtener datos del volumen:", error);
    return (
      <div className="text-center mt-8">
        {intl?.errors?.serverError || "Error al cargar el volumen."}
      </div>
    );
  }
}
