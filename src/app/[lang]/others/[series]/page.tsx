import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import SeriesContent from "@/components/library/manga/SeriesContent";
import { verifySession } from "@/lib/auth/verifySession";
import { listVolumeRatings, findSeriesFavoriteState } from "@/lib/db/reading";
import { getDictionary } from "@/lib/i18n/Dictionary";
import {
  findSeriesBySlug,
  type LibraryVolumeMetadata,
} from "@/lib/db/library";
import {
  getLibrarySection,
  getLibrarySeriesHref,
} from "@/lib/librarySection";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import { sortByPaddedTitle } from "@/lib/utils";
import { isOthersLibraryEnabled } from "@/lib/db/appSettings";
import type { Locale } from "@/lib/types";

interface AggregatedMeta {
  [key: string]: string[];
}

function aggregateMetadata(
  volumes: { metadataObj?: LibraryVolumeMetadata | null }[]
) {
  const fields = [
    "writer", "penciller", "inker", "colorist", "letterer",
    "coverArtist", "editor", "publisher", "imprint", "format",
  ] as const;

  const aggregated: Record<string, Set<string>> = {};
  for (const key of fields) {
    aggregated[key] = new Set();
  }

  for (const vol of volumes) {
    const meta = vol.metadataObj;
    if (!meta) continue;
    for (const key of fields) {
      const raw = meta[key];
      if (typeof raw === "string" && raw.trim() !== "") {
        raw.split(",").forEach((entry) => {
          aggregated[key].add(entry.trim());
        });
      }
    }
  }

  const result: AggregatedMeta = {};
  for (const key of fields) {
    result[key] = Array.from(aggregated[key]);
  }

  return result;
}

interface OthersSeriesPageProps {
  params: Promise<{ lang: string; series: string }>;
}

function SeriesSkeleton() {
  return (
    <div className="p-4">
      <div className="h-8 w-64 rounded bg-sand animate-pulse mb-6" />
      <div className="flex gap-6">
        <div className="w-48 aspect-[3/5] rounded-lg bg-sand animate-pulse flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-sand animate-pulse" style={{ width: `${70 + i * 5}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

async function OthersSeriesPageContent({
  params,
}: OthersSeriesPageProps) {
  const { lang = "es", series } = await params;
  const intl = await getDictionary(lang as Locale);
  const othersLibraryEnabled = await isOthersLibraryEnabled();

  try {
    const user = await verifySession();

    const serie = await findSeriesBySlug({
      slug: series,
      includeGenres: true,
      includeTags: true,
    });

    if (!serie) {
      return (
        <div className="text-center mt-8">
          {(intl?.errors?.notFound as string) || "Serie no encontrada."}
        </div>
      );
    }

    const targetSection = getLibrarySection(
      serie.volumes[0]?.metadataObj?.mangaStyle,
      othersLibraryEnabled
    );

    if (targetSection !== "others") {
      redirect(getLibrarySeriesHref(lang, targetSection, serie.slug));
    }

    const normalizedSerie = {
      ...serie,
      coverImage: getMangaCoverUrl({
        slug: serie.volumes?.[0]?.slug ?? "",
        coverImage: serie.volumes?.[0]?.coverImage ?? null,
        updatedAt: serie.volumes?.[0]?.updatedAt,
      }),
      volumes:
        serie.volumes?.map((vol) => {
          const meta = {
            ...(vol.metadataObj || null),
            genres: Array.isArray(vol.genres)
              ? vol.genres
                  .map((genre) => (genre.name ? { name: genre.name.trim() } : null))
                  .filter(Boolean)
              : [],
            tags: Array.isArray(vol.tags)
              ? vol.tags
                  .map((tag) => (tag.name ? { name: tag.name.trim() } : null))
                  .filter(Boolean)
              : [],
          };
          return {
            ...vol,
            coverImage: getMangaCoverUrl(vol),
            meta,
          };
        }) ?? [],
    };

    const sortedVolumes = sortByPaddedTitle(normalizedSerie.volumes);
    const aggregatedMeta = aggregateMetadata(sortedVolumes);

    let isFavorite = false;
    let averageRating: number | null = null;

    if (user) {
      isFavorite = await findSeriesFavoriteState(user.id, serie.id);

      const volumeIds = serie.volumes.map((v) => v.id);
      const personalMap = await listVolumeRatings(user.id, volumeIds);

      const ratings = serie.volumes
        .map((v) => personalMap.get(v.id) ?? v.metadataObj?.communityRating)
        .filter((r): r is number => r !== null && r !== undefined);

      if (ratings.length > 0) {
        averageRating =
          Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 2) / 2;
      }
    }

    return (
      <SeriesContent
        serieData={{ ...normalizedSerie, volumes: sortedVolumes }}
        lang={lang as Locale}
        intl={intl}
        isFavorite={isFavorite}
        aggregatedMeta={aggregatedMeta}
        averageRating={averageRating}
        user={user}
        section="others"
      />
    );
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("Error al obtener datos de la serie:", error);
    return (
      <div className="text-center mt-8">
        {(intl?.errors?.serverError as string) || "Error al cargar la serie."}
      </div>
    );
  }
}

export default async function OthersSeriesPage({
  params,
}: OthersSeriesPageProps) {
  const othersLibraryEnabled = await isOthersLibraryEnabled();

  if (!othersLibraryEnabled) {
    notFound();
  }

  return (
    <Suspense fallback={<SeriesSkeleton />}>
      <OthersSeriesPageContent params={params} />
    </Suspense>
  );
}
