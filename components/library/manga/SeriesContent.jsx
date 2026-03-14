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

export default function SeriesContent({
  serieData,
  lang,
  intl,
  isFavorite,
  aggregatedMeta,
  averageRating,
  user,
}) {
  const coverImage =
    serieData.volumes?.[serieData.volumes.length - 1]?.coverImage ?? null;
  const meta = serieData.volumes?.[0]?.meta;

  const ageMin = ageRatingMap(meta.ageRating);
  const badgeClass = `text-sm uppercase rounded-md px-3 py-1 mr-2 ${
    ageMin >= 18
      ? "bg-red-500"
      : ageMin >= 16
        ? "bg-[#f5a524] text-onix"
        : ageMin !== null
          ? "bg-neutral-700"
          : "bg-neutral-700"
  }`;

  const isWesternReading =
    meta.mangaStyle === "YesLTR" || meta.mangaStyle === "No";

  return (
    <div className="p-4">
      <section className="flex flex-col md:flex-row">
        {/* Cover Image */}
        <div className="w-full md:w-5/12 2xl:w-1/3">
          {coverImage && (
            <div className="mb-8 md:mb-0 md:mr-4 px-16 md:px-0">
              <Image
                src={coverImage || "/placeholder.svg?=v1"}
                alt={`Cover for ${serieData.title || serieData.filename}`}
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
            {meta.series || serieData.title}
          </h1>

          {/* Read Buttons */}
          <ReadButtonsSeries
            lang={lang}
            intl={intl}
            seriesId={serieData.id}
            initFavorite={isFavorite}
          />

          {/* Rating */}
          <div className="mt-8">
            <SeriesRating rating={averageRating} />
          </div>

          {/* Meta Tags */}
          <div className="mt-2">
            {meta.ageRating && (
              <span className={badgeClass}>
                {ageRatingMap(meta.ageRating) !== null
                  ? `${ageRatingMap(meta.ageRating)}+`
                  : meta.ageRating}
              </span>
            )}
            {meta.languageISO && (
              <span className="text-sm uppercase bg-neutral-700 rounded-md px-3 py-1 mr-2">
                {meta.languageISO}
              </span>
            )}
            <span className="text-sm uppercase bg-neutral-700 rounded-md px-3 py-1">
              {isWesternReading ? intl.manga.readingEn : intl.manga.readingJp}
            </span>
          </div>

          {/* Year & Volumes */}
          <p className="mt-4">
            {meta.year && meta.year} &bull; {serieData.volumes.length}{" "}
            {intl.manga.volumes}
          </p>

          {/* Description */}
          {meta.summary && (
            <>
              <h2 className="text-sm mt-8 mb-1">
                {intl.manga.synopsis} (vol. 1)
              </h2>
              <MangaSummary meta={meta} intl={intl} />
            </>
          )}

          <Separator />

          <MetadataPanel
            meta={{ ...aggregatedMeta, genres: meta.genres, tags: meta.tags }}
            lang={lang}
            intl={intl}
            linkBase="series"
          />
        </div>
      </section>

      {/* SERIES VOLUMES */}
      <section>
        <Separator />
        <h2>{intl.manga.seriesVolumes}</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 2xl:grid-cols-7 gap-4 mt-4">
          {serieData.volumes && serieData.volumes.length > 0 ? (
            serieData.volumes.map((volume, idx) => (
              <MangaCard
                key={idx}
                title={volume.meta?.title || volume.filename}
                href={`/${lang}/manga/volume/${volume.slug}`}
                isSeries={false}
                volumeCount={null}
                cover={volume.coverImage ?? null}
                intl={intl}
                className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
              />
            ))
          ) : (
            <div>
              {intl?.library?.noVolumes ||
                "No hay volúmenes disponibles para esta serie."}
            </div>
          )}
        </div>

        {user.isAdmin && (
          <>
            <Separator />
            <div className="flex flex-wrap items-center gap-4">
              <ScanSeriesButton seriesId={serieData.id} intl={intl} />
              <DeleteMangaItem
                intl={intl}
                type="series"
                slug={serieData.slug}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
