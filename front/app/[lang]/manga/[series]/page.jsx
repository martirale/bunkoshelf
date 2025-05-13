import SerieMangaContent from "@/components/library/manga/SerieMangaContent";
import { verifySession } from "@/lib/auth/verifySession";
import { getDictionary } from "@/lib/i18n/serverDictionary";
import prisma from "@/lib/prisma";

export default async function VolumeMangaPage({ params }) {
  const { lang = "es", series } = await params;
  const intl = await getDictionary(lang);

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/library/manga/series`,
      {
        cache: "no-store",
      }
    );

    const { data: entries } = await res.json();

    // Normalizar las rutas de imagen (para prevenir backslashes)
    const normalizedEntries = entries.map((item) => ({
      ...item,
      coverImage: item.coverImage?.replace(/\\/g, "/") ?? null,
      volumes:
        item.volumes?.map((volume) => ({
          ...volume,
          coverImage: volume.coverImage?.replace(/\\/g, "/") ?? null,
        })) ?? [],
    }));

    const serie = normalizedEntries.find((item) => item.slug === series);

    // Obtención de usuario y estado de favorito
    const user = await verifySession();
    let isFavorite = false;

    if (user) {
      const favEntry = await prisma.userToSeries.findUnique({
        where: {
          userId_seriesId: {
            userId: user.id,
            seriesId: serie.id,
          },
        },
        select: { isFavorite: true },
      });

      isFavorite = favEntry?.isFavorite ?? false;
    }

    if (!serie) {
      return (
        <div className="text-center mt-8">
          {intl?.errors?.notFound || "Serie no encontrada."}
        </div>
      );
    }

    return (
      <SerieMangaContent
        serieData={serie}
        lang={lang}
        intl={intl}
        isFavorite={isFavorite}
      />
    );
  } catch (error) {
    console.error("Error al obtener datos de la serie:", error);
    return (
      <div className="text-center mt-8">
        {intl?.errors?.serverError || "Error al cargar la serie."}
      </div>
    );
  }
}
