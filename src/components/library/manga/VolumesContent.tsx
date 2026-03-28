import Image from "next/image";
import Link from "next/link";
import ReadButtonsVolume from "./ReadButtonsVolume";
import ReadingHistory from "./ReadingHistory";
import MetadataPanel from "./MetadataPanel";
import MangaSummary from "./MangaSummary";
import { ageRatingMap } from "@/lib/utils";
import DeleteMangaItem from "./DeleteMangaItem";
import ScanSeriesButton from "./ScanSeriesButton";
import Separator from "@/components/ui/Separator";
import Tabs from "@/components/ui/Tabs";
import VolumeRating from "./VolumeRating";
import type { Locale, Dictionary, DictionarySection, Session } from "@/lib/types";

interface ReadingEntry {
  id: string;
  readAt: string | null;
}

interface VolumesContentProps {
  volumeData: Record<string, unknown>;
  lang: Locale;
  intl: Dictionary;
  isFavorite: boolean;
  isRead: boolean;
  user: Session | null;
  personalRating: number | null;
  readingEntries: ReadingEntry[];
  firstRead: string | null;
}

export default function VolumesContent({
  volumeData,
  lang,
  intl,
  isFavorite,
  isRead,
  user,
  personalRating,
  readingEntries,
  firstRead,
}: VolumesContentProps) {
  if (!volumeData) {
    return (
      <div className="text-center mt-8">
        {(intl?.errors?.notFound as string) ||
          "No se encontró información de este volumen."}
      </div>
    );
  }

  const volume = volumeData;
  const meta = (volumeData.meta || {}) as Record<string, unknown>;
  const series = volumeData.series as Record<string, unknown> | undefined;
  const isOneshot = series?.isOneshot === true;
  const seriesTitle = series?.title as string | undefined;
  const seriesSlug = series?.slug as string | undefined;

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
          {(volume.coverImage as string) && (
            <div className="mb-8 md:mb-0 md:mr-4 px-16 md:px-0 md:sticky md:top-4 md:self-start">
              <Image
                src={(volume.coverImage as string) || "/placeholder.svg?=v1"}
                alt={`Cover for ${(volume.title as string) || (volume.filename as string)}`}
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
            {meta.title as string}
          </h1>
          {!isOneshot && (
            <div className="py-2">
              <Link
                href={`/${lang}/manga/${seriesSlug}`}
                className="italic hover:underline"
              >
                {intl.manga.series as string} {(meta.series as string) || seriesTitle}
              </Link>
            </div>
          )}

          <ReadButtonsVolume
            lang={lang}
            intl={intl}
            volumeId={volume.id as string}
            volumeTitle={meta.title as string}
            coverSrc={volume.coverImage as string}
            initFavorite={isFavorite}
            initRead={isRead}
            slug={volume.slug as string}
            mangaStyle={meta.mangaStyle as string}
            communityRating={meta.communityRating as number | null}
            initialPersonalRating={personalRating}
          />

          <div className="mt-8">
            <VolumeRating
              volumeId={volume.id as string}
              communityRating={meta.communityRating as number | null}
              initialPersonalRating={personalRating}
            />
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

          <p className="mt-4 flex items-center gap-2">
            {meta.year ? (meta.year as number) : null}{" "}
            {meta.pageCount ? (
              <>
                &bull; {meta.pageCount as number} {intl.manga.pages as string}
              </>
            ) : null}
            {isOneshot && (
              <span className="text-xs uppercase bg-lilah border border-lilah rounded px-1.5">
                Oneshot
              </span>
            )}
          </p>

          {meta.summary ? (
            <>
              <h2 className="text-sm mt-8 mb-1">{intl.manga.synopsis as string}</h2>
              <MangaSummary meta={meta} intl={intl} />
            </>
          ) : null}
          <Tabs
            tabs={[
              {
                label: (intl.manga as DictionarySection).details as string,
                content: <MetadataPanel meta={meta} lang={lang} intl={intl} />,
              },
              {
                label: (intl.manga as DictionarySection).readingHistory as string,
                content: (
                  <ReadingHistory
                    volumeId={volume.id as string}
                    intl={intl}
                    initialEntries={readingEntries}
                    firstRead={firstRead}
                  />
                ),
              },
            ]}
          />
          {user?.isAdmin && (
            <>
              <Separator />
              <div className="flex flex-wrap items-center gap-4">
                <ScanSeriesButton volumeId={volume.id as string} intl={intl} />
                <DeleteMangaItem intl={intl} slug={volume.slug as string} />
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
