import Image from "next/image";
import MangaCard from "@/components/ui/MangaCard";
import ReadButtonsSeries from "./ReadButtonsSeries";
import MetadataPanel from "./MetadataPanel";
import MangaSummary from "./MangaSummary";
import { ageRatingMap } from "@/lib/utils";
import DeleteMangaItem from "./DeleteMangaItem";
import ScanSeriesButton from "./ScanSeriesButton";
import Separator from "@/components/ui/Separator";
import SeriesRating from "./SeriesRating";
import type { LibrarySection } from "@/lib/librarySection";
import { getVolumeProgressRatio } from "@/lib/reader/readingProgress";
import type { Locale, Dictionary, Session } from "@/lib/types";

interface SeriesContentProps {
  serieData: Record<string, unknown>;
  lang: Locale;
  intl: Dictionary;
  isFavorite: boolean;
  aggregatedMeta: Record<string, string[]>;
  averageRating: number | null;
  user: Session | null;
  section?: LibrarySection;
}

export default function SeriesContent({
  serieData,
  lang,
  intl,
  isFavorite,
  aggregatedMeta,
  averageRating,
  user,
  section = "manga",
}: SeriesContentProps) {
  const volumes = serieData.volumes as Record<string, unknown>[];
  const coverImage =
    (volumes?.[volumes.length - 1]?.coverImage as string) ?? null;
  const meta = (volumes?.[0]?.meta || {}) as Record<string, unknown>;

  const ageMin = ageRatingMap(meta.ageRating as string);
  const badgeClass = `text-sm uppercase rounded-md px-3 py-1 mr-2 ${
    ageMin !== null && ageMin >= 18
      ? "bg-red-500"
      : ageMin !== null && ageMin >= 16
        ? "bg-[#f5a524] text-onix"
        : "bg-neutral-700"
  }`;

  const isWesternReading =
    meta.mangaStyle === "YesLTR" || meta.mangaStyle === "No";

  return (
    <div className="p-4">
      <section className="flex flex-col md:flex-row">
        <div className="w-full md:w-5/12 2xl:w-1/3">
          {coverImage && (
            <div className="mb-8 md:mb-0 md:mr-4 px-16 md:px-0 md:sticky md:top-4 md:self-start">
              <Image
                src={coverImage || "/placeholder.svg?=v1"}
                alt={`Cover for ${(serieData.title as string) || (serieData.filename as string)}`}
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
          )}
        </div>

        <div className="w-full md:w-7/12 2xl:w-2/3 2xl:pl-4">
          <h1 className="text-2xl leading-11 md:text-3xl md:leading-14">
            {(meta.series as string) || (serieData.title as string)}
          </h1>

          <ReadButtonsSeries
            lang={lang}
            intl={intl}
            seriesId={serieData.id as string}
            initFavorite={isFavorite}
          />

          <div className="mt-8">
            <SeriesRating rating={averageRating} />
          </div>

          <div className="mt-2">
            {meta.ageRating ? (
              <span className={badgeClass}>
                {ageRatingMap(meta.ageRating as string) !== null
                  ? `${ageRatingMap(meta.ageRating as string)}+`
                  : (meta.ageRating as string)}
              </span>
            ) : null}
            {meta.languageISO ? (
              <span className="text-sm uppercase bg-neutral-700 rounded-md px-3 py-1 mr-2">
                {meta.languageISO as string}
              </span>
            ) : null}
            <span className="text-sm uppercase bg-neutral-700 rounded-md px-3 py-1">
              {isWesternReading ? (intl.manga.readingEn as string) : (intl.manga.readingJp as string)}
            </span>
          </div>

          <p className="mt-4">
            {meta.year ? (meta.year as number) : null} &bull; {volumes.length}{" "}
            {intl.manga.volumes as string}
          </p>

          {meta.summary ? (
            <>
              <h2 className="text-sm mt-8 mb-1">
                {intl.manga.synopsis as string} (vol. 1)
              </h2>
              <MangaSummary meta={meta} intl={intl} />
            </>
          ) : null}

          <Separator />

          <MetadataPanel
            meta={{ ...aggregatedMeta, genres: meta.genres, tags: meta.tags }}
            lang={lang}
            intl={intl}
            linkBase="series"
            section={section}
          />
        </div>
      </section>

      <section>
        <Separator />
        <h2>{intl.manga.seriesVolumes as string}</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 2xl:grid-cols-7 gap-4 mt-4">
          {volumes && volumes.length > 0 ? (
            volumes.map((volume, idx) => {
              const progress =
                (volume.usersProgress as Array<{
                  isRead: boolean;
                  lastPage: number | null;
                  totalPages: number | null;
                }> | undefined)?.[0] ?? null;

              return (
              <MangaCard
                key={idx}
                title={(volume.meta as Record<string, string>)?.title || (volume.filename as string)}
                href={`/${lang}/${section}/volume/${volume.slug as string}`}
                isSeries={false}
                isOneshot={false}
                onGoing={false}
                onPause={false}
                volumeCount={null}
                cover={(volume.coverImage as string) ?? null}
                isDragging={false}
                seriesSlug={null}
                progressRatio={getVolumeProgressRatio(progress)}
                intl={intl}
                className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
              />
              );
            })
          ) : (
            <div>
              {(intl?.library?.noVolumes as string) ||
                "No hay volúmenes disponibles para esta serie."}
            </div>
          )}
        </div>

        {user?.isAdmin && (
          <>
            <Separator />
            <div className="flex flex-wrap items-center gap-4">
              <ScanSeriesButton seriesId={serieData.id as string} intl={intl} />
              <DeleteMangaItem
                intl={intl}
                type="series"
                slug={serieData.slug as string}
                section={section}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
