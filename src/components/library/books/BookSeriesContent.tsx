import Image from "next/image";
import MangaCard from "@/components/ui/MangaCard";
import Separator from "@/components/ui/Separator";
import BookSeriesFavoriteButton from "./BookSeriesFavoriteButton";
import BookMetadataPanel from "./BookMetadataPanel";
import BookMetadataBadges from "./BookMetadataBadges";
import BookAdminActions from "./BookAdminActions";
import BookSummary from "./BookSummary";
import { getBookCoverUrl } from "@/lib/books/cover";
import { getBookPublicationYear, toPlainBookText } from "@/lib/books/metadata";
import { getBookProgressRatio } from "@/lib/books/readingProgress";
import type { BookVolume } from "@/lib/db/books/library";
import type { Dictionary, Locale } from "@/lib/types";

interface BookSeriesContentProps {
  volumes: BookVolume[];
  lang: Locale;
  intl: Dictionary;
  progressById: Record<string, { isRead: boolean; progression: number | null }>;
  isFavorite: boolean;
  isAdmin: boolean;
}

export default function BookSeriesContent({ volumes, lang, intl, progressById, isFavorite, isAdmin }: BookSeriesContentProps) {
  const books = intl.books as Record<string, string>;
  const firstVolume = volumes[0];
  const coverImage = getBookCoverUrl(firstVolume.slug, firstVolume.metadata.coverPath);
  const meta = firstVolume.metadata;
  const description = toPlainBookText(meta.description);

  return (
    <div className="p-4">
      <section className="flex flex-col md:flex-row">
        <div className="w-full md:w-5/12 2xl:w-1/3">
          <div className="mb-8 md:mb-0 md:mr-4 px-16 md:px-0 md:sticky md:top-4 md:self-start">
            {coverImage ? (
              <Image src={coverImage} alt={`${books.coverOf} ${firstVolume.series.title}`} width={0} height={0} sizes="100vw" className="w-full h-auto object-contain rounded-lg" />
            ) : (
              <div className="aspect-[7/10.5] grid place-items-center rounded-lg bg-sand p-6 text-center text-onix">{books.noCover}</div>
            )}
          </div>
        </div>
        <div className="w-full md:w-7/12 2xl:w-2/3 2xl:pl-4">
          <h1 className="text-2xl leading-11 md:text-3xl md:leading-14">{firstVolume.series.title}</h1>
          <BookSeriesFavoriteButton seriesId={firstVolume.series.id} initialFavorite={isFavorite} intl={intl} />
          <BookMetadataBadges metadata={meta} intl={intl} />
          <p className="mt-4">{getBookPublicationYear(meta.publishedAt ?? meta.modifiedAt)} &bull; {volumes.length} {books.books}</p>
          {description && (
            <>
              <h2 className="text-sm mt-8 mb-1">{books.synopsis}{firstVolume.number !== null ? ` (${books.book} ${firstVolume.number})` : null}</h2>
              <BookSummary summary={description} intl={intl} />
            </>
          )}
          <Separator />
          <BookMetadataPanel volume={firstVolume} intl={intl} />
        </div>
      </section>
      <section>
        <Separator />
        <h2>{books.seriesBooks}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 2xl:grid-cols-7 gap-4 mt-4">
          {volumes.map((volume) => (
            <MangaCard
              key={volume.id}
              title={volume.metadata.title}
              href={`/${lang}/books/volume/${volume.slug}`}
              isSeries={false}
              isOneshot={false}
              onGoing={false}
              onPause={false}
              volumeCount={null}
              cover={getBookCoverUrl(volume.slug, volume.metadata.coverPath)}
              isDragging={false}
              seriesSlug={null}
              progressRatio={getBookProgressRatio(progressById[volume.id])}
              offlineVolumeId={volume.id}
              intl={intl}
              className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
            />
          ))}
        </div>
        {isAdmin && (
          <>
            <Separator />
            <BookAdminActions type="series" slug={firstVolume.series.slug} lang={lang} intl={intl} canDownload={process.env.LIB_PROVIDER === "cloud"} />
          </>
        )}
      </section>
    </div>
  );
}
