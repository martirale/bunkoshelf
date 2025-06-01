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

    // Ayudante para capitalizar
    function capitalize(text) {
      return (
        text.trim().charAt(0).toUpperCase() + text.trim().slice(1).toLowerCase()
      );
    }

    const meta = {
      ...(volumeEntry.metadataObj || null),
      genres: Array.isArray(volumeEntry.genres)
        ? volumeEntry.genres
            .map((g) =>
              g.genre?.name ? { name: capitalize(g.genre.name) } : null
            )
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
        ? `/api/library/manga/cover${volumeEntry.coverImage
            .replace(/\\/g, "/")
            .replace(/^\/?covers/, "")}`
        : null,
      meta,
    };

    let isFavorite = false;

    if (user) {
      const favEntry = await prisma.userToVolume.findUnique({
        where: {
          userId_volumeId: {
            userId: user.id,
            volumeId: volumeEntry.id,
          },
        },
        select: { isFavorite: true },
      });

      isFavorite = favEntry?.isFavorite ?? false;
    }

    let isRead = false;

    if (user) {
      const readEntry = await prisma.userToVolume.findUnique({
        where: {
          userId_volumeId: {
            userId: user.id,
            volumeId: volumeEntry.id,
          },
        },
        select: { isRead: true },
      });

      isRead = readEntry?.isRead ?? false;
    }

    return (
      <VolumesContent
        volumeData={normalizedVolume}
        lang={lang}
        intl={intl}
        isFavorite={isFavorite}
        isRead={isRead}
      />
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
