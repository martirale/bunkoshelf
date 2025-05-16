import VolumeMangaContent from "@/components/library/manga/VolumeMangaContent";
import { verifySession } from "@/lib/auth/verifySession";
import { getDictionary } from "@/lib/i18n/serverDictionary";
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

    // Normalizar la portada
    const normalizedVolume = {
      ...volumeEntry,
      coverImage: volumeEntry.coverImage?.replace(/\\/g, "/") ?? null,
      meta: volumeEntry.metadataObj || null,
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

    return (
      <VolumeMangaContent
        volumeData={normalizedVolume}
        lang={lang}
        intl={intl}
        isFavorite={isFavorite}
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
