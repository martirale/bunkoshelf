import Image from "next/image";
import Link from "next/link";
import ReadButtonsVolume from "@/ui/library/manga/ReadButtonsVolume";
import MangaSummary from "./MangaSummary";
import { ageRatingMap } from "@/lib/utils";

export default function VolumeMangaContent({
  volumeData,
  lang,
  intl,
  isFavorite,
}) {
  if (!volumeData) {
    return (
      <div className="text-center mt-8">
        {intl?.errors?.notFound ||
          "No se encontró información de este volumen."}
      </div>
    );
  }

  const volume = volumeData;
  const meta = volumeData.meta;
  const isOneshot = volumeData.series?.isOneshot === true;
  const seriesTitle = volumeData.series?.title;
  const seriesSlug = volumeData.series?.slug;

  const ageMin = ageRatingMap(meta.ageRating);
  const badgeClass = `text-sm uppercase rounded-md px-3 py-1 mr-3 border ${
    ageMin >= 18
      ? "border-[#f54180] text-[#f54180]"
      : ageMin >= 16
      ? "border-[#f5a524] text-[#f5a524]"
      : ageMin !== null
      ? "border-zinc-700"
      : "border-zinc-700"
  }`;

  return (
    <div className="p-4 mb-16">
      <section className="flex flex-col md:flex-row">
        {/* Cover Image */}
        <div className="w-full md:w-5/12 2xl:w-1/3">
          {volume.coverImage && (
            <div className="mb-8 md:mb-0 md:mr-4 px-16 md:px-0">
              <Image
                src={volume.coverImage || "/placeholder.svg?=v1"}
                alt={`Cover for ${volume.title || volume.filename}`}
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
          )}
        </div>

        <div className="w-full md:w-7/12 2xl:w-2/3 2xl:pl-4">
          {/* Series Title */}
          <h1 className="text-2xl leading-11 md:text-3xl md:leading-14">
            {meta.title}
          </h1>
          {!isOneshot && (
            <Link href={`/${lang}/manga/${seriesSlug}`} className="italic">
              {intl.manga.series} {meta.series || seriesTitle}
            </Link>
          )}

          {/* Read Buttons */}
          <ReadButtonsVolume
            lang={lang}
            intl={intl}
            volumeId={volume.id}
            initFavorite={isFavorite}
            slug={volume.slug}
          />

          {/* Meta Tags */}
          <div className="mt-8 2xl:mt-10">
            {isOneshot && (
              <span className="text-sm uppercase bg-lilah border border-lilah rounded-md px-3 py-1 mr-3">
                Oneshot
              </span>
            )}
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

          {/* Year */}
          <p className="mt-4">{meta.year && meta.year}</p>

          {/* Description */}
          {meta.summary && (
            <>
              <h2 className="text-sm mt-8 mb-1">{intl.manga.synopsis}</h2>
              <MangaSummary meta={meta} />
            </>
          )}

          <div className="border-t border-zinc-800 my-6"></div>

          {/* Author Info */}
          {meta.writer && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.author}
              </p>
              <p className="w-2/3 md:w-4/5">{meta.writer}</p>
            </div>
          )}

          {meta.penciller && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.penciller}
              </p>
              <p className="w-2/3 md:w-4/5">{meta.penciller}</p>
            </div>
          )}

          {meta.inker && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.inker}
              </p>
              <p className="w-2/3 md:w-4/5">{meta.inker}</p>
            </div>
          )}

          {meta.colorist && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.colorist}
              </p>
              <p className="w-2/3 md:w-4/5">{meta.colorist}</p>
            </div>
          )}

          {meta.letterer && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.letterer}
              </p>
              <p className="w-2/3 md:w-4/5">{meta.letterer}</p>
            </div>
          )}

          {meta.coverArtist && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.coverArtist}
              </p>
              <p className="w-2/3 md:w-4/5">{meta.coverArtist}</p>
            </div>
          )}

          {meta.editor && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.editor}
              </p>
              <p className="w-2/3 md:w-4/5">{meta.editor}</p>
            </div>
          )}

          {meta.translator && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.translator}
              </p>
              <p className="w-2/3 md:w-4/5">{meta.translator}</p>
            </div>
          )}

          {meta.publisher && (
            <div className="flex flex-row items-baseline max-w-3xl">
              <p className="text-sm uppercase w-1/3 md:w-1/5">
                {intl.manga.publisher}
              </p>
              <p className="w-2/3 md:w-4/5">{meta.publisher}</p>
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
    </div>
  );
}
