import Image from "next/image";
import MangaCard from "@/ui/library/manga/MangaCard";
import ReadButtonsSeries from "@/ui/library/manga/ReadButtonsSeries";
import { ageRatingMap } from "@/lib/utils";

export default function SerieMangaContent({
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
  const badgeClass = `text-sm uppercase rounded-md px-3 py-1 mr-3 border ${
    ageMin >= 18
      ? "border-red-500 text-red-500"
      : ageMin >= 16
      ? "border-yellow-500 text-yellow-500"
      : ageMin !== null
      ? "border-zinc-700"
      : "border-zinc-700"
  }`;

  return (
    <div className="p-4 mb-16">
      <section className="flex flex-col md:flex-row">
        {/* Cover Image */}
        <div className="w-full md:w-1/3">
          {coverImage && (
            <div className="mb-8 md:mb-0 md:mr-8 px-16 md:px-0">
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

        <div className="w-full md:w-2/3">
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
          <div className="mt-16">
            {meta.ageRating && (
              <span className={badgeClass}>
                {ageRatingMap(meta.ageRating) !== null
                  ? `${ageRatingMap(meta.ageRating)}+`
                  : meta.ageRating}
              </span>
            )}
            {meta.languageISO && (
              <span className="text-sm uppercase border border-zinc-700 rounded-md px-3 py-1 mr-3">
                {meta.languageISO}
              </span>
            )}
            <span className="text-sm uppercase border border-zinc-700 rounded-md px-3 py-1">
              Oriental
            </span>
          </div>

          {/* Year & Volumes */}
          <p className="mt-4">
            {meta.year && meta.year} &bull; {serieData.volumes.length}{" "}
            {intl.manga.volumes}
          </p>

          {/* Description */}
          {meta.summary && (
            <div className="mt-8 max-w-2xl">
              <h2 className="text-sm mb-1">{intl.manga.synopsis} (vol. 1)</h2>
              <p>{meta.summary}</p>
            </div>
          )}

          <div className="border-t border-zinc-800 my-6"></div>

          {/* Author Info */}
          {aggregatedMeta.writer?.length > 0 && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.author}
              </p>
              <p className="w-2/3 md:w-4/5">
                {aggregatedMeta.writer.join(", ")}
              </p>
            </div>
          )}

          {aggregatedMeta.penciller?.length > 0 && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.penciller}
              </p>
              <p className="w-2/3 md:w-4/5">
                {aggregatedMeta.penciller.join(", ")}
              </p>
            </div>
          )}

          {aggregatedMeta.inker?.length > 0 && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.inker}
              </p>
              <p className="w-2/3 md:w-4/5">
                {aggregatedMeta.inker.join(", ")}
              </p>
            </div>
          )}

          {aggregatedMeta.colorist?.length > 0 && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.colorist}
              </p>
              <p className="w-2/3 md:w-4/5">
                {aggregatedMeta.colorist.join(", ")}
              </p>
            </div>
          )}

          {aggregatedMeta.letterer?.length > 0 && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.letterer}
              </p>
              <p className="w-2/3 md:w-4/5">
                {aggregatedMeta.letterer.join(", ")}
              </p>
            </div>
          )}

          {aggregatedMeta.coverArtist?.length > 0 && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.coverArtist}
              </p>
              <p className="w-2/3 md:w-4/5">
                {aggregatedMeta.coverArtist.join(", ")}
              </p>
            </div>
          )}

          {aggregatedMeta.editor?.length > 0 && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.editor}
              </p>
              <p className="w-2/3 md:w-4/5">
                {aggregatedMeta.editor.join(", ")}
              </p>
            </div>
          )}

          {aggregatedMeta.translator?.length > 0 && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.translator}
              </p>
              <p className="w-2/3 md:w-4/5">
                {aggregatedMeta.translator.join(", ")}
              </p>
            </div>
          )}

          {aggregatedMeta.publisher?.length > 0 && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.publisher}
              </p>
              <p className="w-2/3 md:w-4/5">
                {aggregatedMeta.publisher.join(", ")}
              </p>
            </div>
          )}

          {/* Classification */}
          {meta.genreArray.length > 0 && (
            <div className="flex flex-row items-baseline max-w-3xl mt-8">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.genre}
              </p>
              <div className="w-2/3 md:w-4/5 flex flex-wrap gap-1">
                {meta.genreArray.map((genre, idx) => (
                  <span
                    key={idx}
                    className="text-xs uppercase border border-zinc-700 rounded-md px-2 py-1"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {meta.tagsArray && (
            <div className="flex flex-row items-baseline max-w-3xl mt-1">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.tags}
              </p>
              <div className="w-2/3 md:w-4/5 flex flex-wrap gap-1">
                {meta.tagsArray.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs uppercase border border-zinc-700 rounded-md px-2 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SERIES VOLUMES */}
      <section>
        <div className="border-t border-zinc-800 my-6"></div>

        <h2>{intl.manga.seriesVolumes}</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 2xl:grid-cols-6 gap-4 mt-4">
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
                className="font-roboto font-bold leading-5 2xl:leading-6 text-base 2xl:text-xl"
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
