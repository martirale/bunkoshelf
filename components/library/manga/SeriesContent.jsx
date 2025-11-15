import Image from "next/image";
import Link from "next/link";
import MangaCard from "@/components/ui/MangaCard";
import ReadButtonsSeries from "./ReadButtonsSeries";
import MangaSummary from "./MangaSummary";
import { ageRatingMap } from "@/lib/utils";
import DeleteMangaItem from "./DeleteMangaItem";

export default function SeriesContent({
  serieData,
  lang,
  intl,
  isFavorite,
  aggregatedMeta,
}) {
  const coverImage =
    serieData.volumes?.[serieData.volumes.length - 1]?.coverImage ?? null;
  const meta = serieData.volumes?.[0]?.meta;

  const ageMin = ageRatingMap(meta.ageRating);
  const badgeClass = `text-sm uppercase rounded-md px-3 py-1 mr-2 border ${
    ageMin >= 18
      ? "border-red-500 text-red-500"
      : ageMin >= 16
      ? "border-[#f5a524] text-[#f5a524]"
      : ageMin !== null
      ? "border-neutral-700"
      : "border-neutral-700"
  }`;

  const isWesternReading = meta.mangaStyle === "YesAndLeftToRight";

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
          <DeleteMangaItem type="series" slug={serieData.slug} />
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

          {/* Meta Tags */}
          <div className="mt-8">
            {meta.ageRating && (
              <span className={badgeClass}>
                {ageRatingMap(meta.ageRating) !== null
                  ? `${ageRatingMap(meta.ageRating)}+`
                  : meta.ageRating}
              </span>
            )}
            {meta.languageISO && (
              <span className="text-sm uppercase border border-neutral-700 rounded-md px-3 py-1 mr-2">
                {meta.languageISO}
              </span>
            )}
            <span className="text-sm uppercase border border-neutral-700 rounded-md px-3 py-1">
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

          <div className="border-t border-neutral-700 my-6"></div>

          {/* Author Info */}
          {(() => {
            const normalize = (field) => {
              if (!field) return null;
              if (Array.isArray(field)) {
                if (field.length === 0) return null;
                return field.join(", ");
              }
              if (typeof field === "string") {
                const parts = field
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (parts.length === 0) return null;
                return parts.join(", ");
              }
              return String(field);
            };

            const renderMetaField = (field, labelKey) => {
              const value = normalize(field);
              if (!value) return null;
              return (
                <div className="flex flex-row items-baseline max-w-3xl">
                  <p className="text-sm uppercase w-1/3 md:w-1/5">
                    {intl.manga[labelKey]}
                  </p>
                  <p className="w-2/3 md:w-4/5">{value}</p>
                </div>
              );
            };

            return (
              <>
                {renderMetaField(aggregatedMeta.writer, "author")}
                {renderMetaField(aggregatedMeta.penciller, "penciller")}
                {renderMetaField(aggregatedMeta.inker, "inker")}
                {renderMetaField(aggregatedMeta.colorist, "colorist")}
                {renderMetaField(aggregatedMeta.letterer, "letterer")}
                {renderMetaField(aggregatedMeta.coverArtist, "coverArtist")}
                {renderMetaField(aggregatedMeta.editor, "editor")}
                {renderMetaField(aggregatedMeta.translator, "translator")}
                {renderMetaField(aggregatedMeta.publisher, "publisher")}
              </>
            );
          })()}

          {/* Classification */}
          {meta.genres.length > 0 && (
            <div className="flex flex-row items-baseline max-w-3xl mt-8">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.genre}
              </p>
              <div className="w-2/3 md:w-4/5 flex flex-wrap gap-2">
                {meta.genres.map((genre, idx) => (
                  <Link
                    key={idx}
                    href={{
                      pathname: `/${lang}/manga/series`,
                      query: { genre: genre.name },
                    }}
                    scroll={false}
                    className="text-xs uppercase border border-neutral-700 rounded-md px-2 py-1 hover:border-lilah transition-all duration-300"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {meta.tags.length > 0 && (
            <div className="flex flex-row items-baseline max-w-3xl mt-2">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.tags}
              </p>
              <div className="w-2/3 md:w-4/5 flex flex-wrap gap-2">
                {meta.tags.map((tag, idx) => (
                  <Link
                    key={idx}
                    href={{
                      pathname: `/${lang}/manga/series`,
                      query: { tag: tag.name },
                    }}
                    scroll={false}
                    className="text-xs uppercase border border-neutral-700 rounded-md px-2 py-1 hover:border-lilah transition-all duration-300"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SERIES VOLUMES */}
      <section>
        <div className="border-t border-neutral-700 my-6"></div>

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
      </section>
    </div>
  );
}
