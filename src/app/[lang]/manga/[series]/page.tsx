import { Suspense } from "react";
import SeriesContent from "@/components/library/manga/SeriesContent";
import DetailSkeleton from "@/components/library/manga/DetailSkeleton";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/verifySession";
import { listVolumeRatings, findSeriesFavoriteState } from "@/lib/db/reading";
import { getDictionary } from "@/lib/i18n/Dictionary";
import {
  findSeriesBySlugBasic,
  listPagedVolumes,
  type SeriesVolumeAggregate,
  listSeriesVolumeAggregates,
  listVolumeProgressByIds,
} from "@/lib/db/library";
import {
  getLibrarySection,
  getLibrarySeriesHref,
} from "@/lib/librarySection";
import { getMangaCoverUrl } from "@/lib/mangaCover";
import { LIBRARY_PAGE_SIZE } from "@/lib/libraryPagination";
import type { Locale } from "@/lib/types";

function aggregateMetadata(
  volumes: SeriesVolumeAggregate[]
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
    for (const key of fields) {
      const raw = vol[key];
      if (typeof raw === "string" && raw.trim() !== "") {
        raw.split(",").forEach((entry) => {
          aggregated[key].add(entry.trim());
        });
      }
    }
  }

  const result: Record<string, string[]> = {};
  for (const key of fields) {
    result[key] = Array.from(aggregated[key]);
  }

  return result;
}

interface SeriesMangaPageProps {
  params: Promise<{ lang: string; series: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

async function SeriesMangaPageContent({
  params,
  searchParams,
}: SeriesMangaPageProps) {
  const { lang = "es", series } = await params;
  const resolvedSearchParams = await searchParams;
  const pageRaw = resolvedSearchParams.page ?? "1";
  const parsedPage = parseInt(pageRaw, 10);
  const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const intl = await getDictionary(lang as Locale);

  try {
    const user = await verifySession();

    const serie = await findSeriesBySlugBasic(series);

    if (!serie) {
      return (
        <div className="text-center mt-8">
          {(intl?.errors?.notFound as string) || "Serie no encontrada."}
        </div>
      );
    }

    const [firstVolumePage, volumePage, aggregateVolumes] = await Promise.all([
      listPagedVolumes({
        page: 1,
        pageSize: 1,
        seriesIds: [serie.id],
        includeGenres: true,
        includeTags: true,
      }),
      listPagedVolumes({
        page,
        pageSize: LIBRARY_PAGE_SIZE,
        seriesIds: [serie.id],
      }),
      listSeriesVolumeAggregates(serie.id),
    ]);

    const firstVolume = firstVolumePage.items[0] ?? null;

    if (!firstVolume) {
      return (
        <div className="text-center mt-8">
          {(intl?.errors?.notFound as string) || "Serie no encontrada."}
        </div>
      );
    }

    const targetSection = getLibrarySection(firstVolume.metadataObj?.mangaStyle);

    if (targetSection !== "manga") {
      redirect(getLibrarySeriesHref(lang, targetSection, serie.slug));
    }

    const progressById = user
      ? await listVolumeProgressByIds(
          user.id,
          volumePage.items.map((volume) => volume.id)
        )
      : {};

    const paginatedVolumes = volumePage.items.map((vol) => {
      const meta = {
        ...(vol.metadataObj || null),
        genres: [],
        tags: [],
      };

      return {
        ...vol,
        usersProgress: progressById[vol.id] ? [progressById[vol.id]] : [],
        coverImage: getMangaCoverUrl(vol),
        meta,
      };
    });

    const normalizedSerie = {
      ...serie,
      coverImage: getMangaCoverUrl({
        slug: firstVolume.slug,
        coverImage: firstVolume.coverImage ?? null,
        updatedAt: firstVolume.updatedAt,
      }),
      meta: {
        ...(firstVolume.metadataObj || null),
        genres: (firstVolume.genres ?? [])
          .map((genre) => (genre.name ? { name: genre.name.trim() } : null))
          .filter(Boolean),
        tags: (firstVolume.tags ?? [])
          .map((tag) => (tag.name ? { name: tag.name.trim() } : null))
          .filter(Boolean),
      },
      volumes: paginatedVolumes,
    };

    const aggregatedMeta = aggregateMetadata(aggregateVolumes);

    let isFavorite = false;
    let averageRating: number | null = null;

    if (user) {
      isFavorite = await findSeriesFavoriteState(user.id, serie.id);

      const volumeIds = aggregateVolumes.map((volume) => volume.id);
      const personalMap = await listVolumeRatings(user.id, volumeIds);

      const ratings = aggregateVolumes
        .map((volume) => personalMap.get(volume.id) ?? volume.communityRating)
        .filter((r): r is number => r !== null && r !== undefined);

      if (ratings.length > 0) {
        averageRating =
          Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 2) / 2;
      }
    }

    return (
      <SeriesContent
        serieData={normalizedSerie}
        lang={lang as Locale}
        intl={intl}
        isFavorite={isFavorite}
        aggregatedMeta={{
          ...aggregatedMeta,
          genres: normalizedSerie.meta.genres as { name: string }[],
          tags: normalizedSerie.meta.tags as { name: string }[],
        }}
        averageRating={averageRating}
        user={user}
        currentPage={volumePage.page}
        totalPages={volumePage.totalPages}
        totalVolumes={volumePage.total}
        section="manga"
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

export default function SeriesMangaPage({
  params,
  searchParams,
}: SeriesMangaPageProps) {
  return (
    <Suspense fallback={<DetailSkeleton kind="series" />}>
      <SeriesMangaPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
