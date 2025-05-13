import VolumeMangaContent from "@/components/library/manga/VolumeMangaContent";
import { verifySession } from "@/lib/auth/verifySession";
import { getDictionary } from "@/lib/i18n/serverDictionary";
import prisma from "@/lib/prisma";

export default async function VolumeMangaPage({ params }) {
  const { lang = "es", slug } = await params;
  const intl = await getDictionary(lang);

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/library/manga/volumes`,
      { cache: "no-store" }
    );

    const { data: entries } = await res.json();

    // Normalizar las rutas de imagen (para prevenir backslashes)
    entries.forEach((entry) => {
      if (entry.coverImage) {
        entry.coverImage = entry.coverImage.replace(/\\/g, "/");
      }

      if (entry.volumes?.length > 0) {
        entry.volumes = entry.volumes.map((volume) => ({
          ...volume,
          coverImage: volume.coverImage?.replace(/\\/g, "/"),
        }));
      }
    });

    const volumeEntry = entries.find((item) => item.slug === slug);

    // Obtención de usuario y estado de favorito
    const user = await verifySession();
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

    if (!volumeEntry) {
      return (
        <div className="text-center mt-8">
          {intl?.errors?.notFound || "Volumen no encontrado."}
        </div>
      );
    }

    return (
      <VolumeMangaContent
        volumeData={volumeEntry}
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
