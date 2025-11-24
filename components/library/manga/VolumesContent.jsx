import Image from "next/image";
import Link from "next/link";
import ReadButtonsVolume from "./ReadButtonsVolume";
import MangaSummary from "./MangaSummary";
import { ageRatingMap } from "@/lib/utils";
import DeleteMangaItem from "./DeleteMangaItem";
import Separator from "@/components/ui/Separator";

export default function VolumesContent({
  volumeData,
  lang,
  intl,
  isFavorite,
  isRead,
  user,
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
            <div className="py-2">
              <Link
                href={`/${lang}/manga/${seriesSlug}`}
                className="italic hover:underline"
              >
                {intl.manga.series} {meta.series || seriesTitle}
              </Link>
            </div>
          )}

          {/* Read Buttons */}
          <ReadButtonsVolume
            lang={lang}
            intl={intl}
            volumeId={volume.id}
            volumeTitle={meta.title}
            initFavorite={isFavorite}
            initRead={isRead}
            slug={volume.slug}
            mangaStyle={meta.mangaStyle}
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
              <span className="text-sm uppercase bg-neutral-700 rounded-md px-3 py-1 mr-2">
                {meta.languageISO}
              </span>
            )}
            <span className="text-sm uppercase bg-neutral-700 rounded-md px-3 py-1">
              {isWesternReading ? intl.manga.readingEn : intl.manga.readingJp}
            </span>
          </div>

          {/* Year */}
          <p className="mt-4 flex items-center gap-2">
            {meta.year && meta.year}{" "}
            {meta.pageCount && (
              <>
                &bull; {meta.pageCount} {intl.manga.pages}
              </>
            )}
            {isOneshot && (
              <span className="text-xs uppercase bg-lilah border border-lilah rounded px-1.5">
                Oneshot
              </span>
            )}
          </p>

          {/* Description */}
          {meta.summary && (
            <>
              <h2 className="text-sm mt-8 mb-1">{intl.manga.synopsis}</h2>
              <MangaSummary meta={meta} intl={intl} />
            </>
          )}

          <Separator />

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
                {renderMetaField(meta.writer, "author")}
                {renderMetaField(meta.penciller, "penciller")}
                {renderMetaField(meta.inker, "inker")}
                {renderMetaField(meta.colorist, "colorist")}
                {renderMetaField(meta.letterer, "letterer")}
                {renderMetaField(meta.coverArtist, "coverArtist")}
                {renderMetaField(meta.editor, "editor")}
                {renderMetaField(meta.publisher, "publisher")}
                {renderMetaField(meta.imprint, "imprint")}
                {renderMetaField(meta.format, "format")}
                {renderMetaField(meta.gtin, "gtin")}
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
                      pathname: `/${lang}/manga/volumes`,
                      query: { genre: genre.name },
                    }}
                    scroll={false}
                    className="text-xs uppercase bg-neutral-700 rounded-md px-2 py-1 hover:bg-lilah transition-all duration-300"
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
                      pathname: `/${lang}/manga/volumes`,
                      query: { tag: tag.name },
                    }}
                    scroll={false}
                    className="text-xs uppercase bg-neutral-700 rounded-md px-2 py-1 hover:bg-lilah transition-all duration-300"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {user.isAdmin && (
            <>
              <Separator />
              <DeleteMangaItem intl={intl} slug={volume.slug} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
