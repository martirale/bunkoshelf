import SerieMangaContent from "@/components/library/manga/SerieMangaContent";
import { verifySession } from "@/lib/auth/verifySession";
import { getDictionary } from "@/lib/i18n/serverDictionary";
import prisma from "@/lib/prisma";
import { sortByPaddedTitle } from "@/lib/utils";

export default async function SeriesMangaPage({ params }) {
  const { lang = "es", series } = await params;
  const intl = await getDictionary(lang);

  try {
    const user = await verifySession();

    const serie = await prisma.mangaSeries.findUnique({
      where: {
        slug: series,
      },
      include: {
        volumes: {
          include: {
            metadataObj: true,
          },
        },
      },
    });

    if (!serie) {
      return (
        <div className="text-center mt-8">
          {intl?.errors?.notFound || "Serie no encontrada."}
        </div>
      );
    }

    const normalizedSerie = {
      ...serie,
      coverImage: serie.volumes?.[0]?.coverImage?.replace(/\\/g, "/") ?? null,
      volumes:
        serie.volumes?.map((vol) => ({
          ...vol,
          coverImage: vol.coverImage?.replace(/\\/g, "/") ?? null,
          meta: vol.metadataObj || null,
        })) ?? [],
    };

    const sortedVolumes = sortByPaddedTitle(normalizedSerie.volumes);

    let isFavorite = false;

    if (user) {
      const favEntry = await prisma.userToSeries.findUnique({
        where: {
          userId_seriesId: {
            userId: user.id,
            seriesId: serie.id,
          },
        },
        select: {
          isFavorite: true,
        },
      });

      isFavorite = favEntry?.isFavorite ?? false;
    }

    return (
      <SerieMangaContent
        serieData={{ ...normalizedSerie, volumes: sortedVolumes }}
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
