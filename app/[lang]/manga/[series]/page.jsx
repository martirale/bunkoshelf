import SeriesContent from "@/components/library/manga/SeriesContent";
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
    publisher: new Set(),
    imprint: new Set(),
    format: new Set(),
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

    // Normalizar la portada y los volúmenes
    const normalizedSerie = {
      ...serie,
      coverImage: serie.volumes?.[0]?.coverImage
        ? `/api/library/manga/cover/${serie.volumes[0].slug}/${serie.volumes[0].coverImage}`
        : null,
      volumes:
        serie.volumes?.map((vol) => {
          const meta = {
            ...(vol.metadataObj || null),
            genres: Array.isArray(vol.genres)
              ? vol.genres
                  .map((g) =>
                    g.genre?.name ? { name: g.genre.name.trim() } : null
                  )
                  .filter(Boolean)
              : [],
            tags: Array.isArray(vol.tags)
              ? vol.tags
                  .map((t) =>
                    t.tag?.name ? { name: t.tag.name.trim() } : null
                  )
                  .filter(Boolean)
              : [],
          };

          return {
            ...vol,
            coverImage: vol.coverImage
              ? `/api/library/manga/cover/${vol.slug}/${vol.coverImage}`
              : null,
            meta,
          };
        }) ?? [],
    };

    const sortedVolumes = sortByPaddedTitle(normalizedSerie.volumes);
    const aggregatedMeta = aggregateMetadata(sortedVolumes);

    let isFavorite = false;
    let averageRating = null;

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

      const volumeIds = serie.volumes.map((v) => v.id);
      const userVolumes = await prisma.userToVolume.findMany({
        where: {
          userId: user.id,
          volumeId: { in: volumeIds },
        },
        select: { volumeId: true, personalRating: true },
      });

      const personalMap = new Map(
        userVolumes
          .filter((uv) => uv.personalRating !== null)
          .map((uv) => [uv.volumeId, uv.personalRating]),
      );

      const ratings = serie.volumes
        .map((v) => personalMap.get(v.id) ?? v.metadataObj?.communityRating)
        .filter((r) => r !== null && r !== undefined);

      if (ratings.length > 0) {
        averageRating =
          Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 2) / 2;
      }
    }

    return (
      <SeriesContent
        serieData={{ ...normalizedSerie, volumes: sortedVolumes }}
        lang={lang}
        intl={intl}
        isFavorite={isFavorite}
        aggregatedMeta={aggregatedMeta}
        averageRating={averageRating}
        user={user}
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
