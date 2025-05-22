import SerieMangaContent from "@/components/library/manga/SerieMangaContent";
import { verifySession } from "@/lib/auth/verifySession";
import { getDictionary } from "@/lib/i18n/Dictionary";
import prisma from "@/lib/prisma";
import { sortByPaddedTitle } from "@/lib/utils";

function aggregateMetadata(volumes) {
  const aggregated = {
    writer: new Set(),
    penciller: new Set(),
    inker: new Set(),
    colorist: new Set(),
    letterer: new Set(),
    coverArtist: new Set(),
    editor: new Set(),
    translator: new Set(),
    publisher: new Set(),
  };

  for (const vol of volumes) {
    const meta = vol.metadataObj || {};
    for (const key in aggregated) {
      const raw = meta[key];
      if (typeof raw === "string" && raw.trim() !== "") {
        raw.split(",").forEach((entry) => {
          aggregated[key].add(entry.trim());
        });
      }
    }
  }

  // Convert Sets a arrays ordenadas alfabéticamente
  const result = {};
  for (const key in aggregated) {
    result[key] = Array.from(aggregated[key]);
  }

  return result;
}

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

    // Ayudante para capitalizar
    function capitalize(text) {
      return (
        text.trim().charAt(0).toUpperCase() + text.trim().slice(1).toLowerCase()
      );
    }

    // Normalizar la portada y los volúmenes
    const normalizedSerie = {
      ...serie,
      coverImage: serie.volumes?.[0]?.coverImage
        ? `/api/library/manga/cover${serie.volumes[0].coverImage
            .replace(/\\/g, "/")
            .replace(/^\/?covers/, "")}`
        : null,
      volumes:
        serie.volumes?.map((vol) => {
          const meta = vol.metadataObj || null;

          return {
            ...vol,
            coverImage: vol.coverImage
              ? `/api/library/manga/cover${vol.coverImage
                  .replace(/\\/g, "/")
                  .replace(/^\/?covers/, "")}`
              : null,
            meta: {
              ...meta,
              genreArray: meta?.genre
                ? meta.genre
                    .split(",")
                    .map((g) => g.trim().replace(/^\w/, (c) => c.toUpperCase()))
                : [],
              tagsArray: meta?.tags
                ? meta.tags.split(",").map((t) => t.trim())
                : [],
            },
          };
        }) ?? [],
    };

    const sortedVolumes = sortByPaddedTitle(normalizedSerie.volumes);
    const aggregatedMeta = aggregateMetadata(sortedVolumes);

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
        aggregatedMeta={aggregatedMeta}
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
