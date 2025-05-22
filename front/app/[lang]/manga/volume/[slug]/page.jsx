import VolumeMangaContent from "@/components/library/manga/VolumeMangaContent";
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

    const meta = volumeEntry.metadataObj || null;

    const normalizedMeta = {
      ...meta,
      genreArray: meta?.genre
        ? meta.genre.split(",").map((g) => capitalize(g))
        : [],
      tagsArray: meta?.tags ? meta.tags.split(",").map((t) => t.trim()) : [],
    };

    // Normalizar la portada
    const normalizedVolume = {
      ...volumeEntry,
      coverImage: volumeEntry.coverImage
        ? `/api/library/manga/cover${volumeEntry.coverImage
            .replace(/\\/g, "/")
            .replace(/^\/?covers/, "")}`
        : null,
      meta: normalizedMeta,
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
      <VolumeMangaContent
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
