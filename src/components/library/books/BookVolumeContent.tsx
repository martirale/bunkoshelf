import Image from "next/image";
import Link from "next/link";
import Separator from "@/components/ui/Separator";
import Tabs from "@/components/ui/Tabs";
import BookReaderButton from "./BookReaderButton";
import BookMetadataPanel from "./BookMetadataPanel";
import BookMetadataBadges from "./BookMetadataBadges";
import BookAdminActions from "./BookAdminActions";
import BookSummary from "./BookSummary";
import { getBookCoverUrl } from "@/lib/books/cover";
import { getBookPublicationYear, toPlainBookText } from "@/lib/books/metadata";
import type { BookVolume } from "@/lib/db/books/library";
import type { Dictionary, Locale } from "@/lib/types";

interface BookVolumeContentProps {
  volume: BookVolume;
  lang: Locale;
  intl: Dictionary;
  isAdmin: boolean;
}

export default function BookVolumeContent({ volume, lang, intl, isAdmin }: BookVolumeContentProps) {
  const books = intl.books as Record<string, string>;
  const coverImage = getBookCoverUrl(volume.slug, volume.metadata.coverPath);
  const description = toPlainBookText(volume.metadata.description);

  return (
    <div className="p-4">
      <section className="flex flex-col md:flex-row">
        <div className="w-full md:w-5/12 2xl:w-1/3">
          <div className="mb-8 md:mb-0 md:mr-4 px-16 md:px-0 md:sticky md:top-4 md:self-start">
            {coverImage ? (
              <Image
                src={coverImage}
                alt={`${books.coverOf} ${volume.metadata.title}`}
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto object-contain rounded-lg"
              />
            ) : (
              <div className="aspect-[7/10.5] grid place-items-center rounded-lg bg-sand p-6 text-center text-onix">{books.noCover}</div>
            )}
          </div>
        </div>
        <div className="w-full md:w-7/12 2xl:w-2/3 2xl:pl-4">
          <h1 className="text-2xl leading-11 md:text-3xl md:leading-14">{volume.metadata.title}</h1>
          {volume.metadata.subtitle && <p className="py-2 italic">{volume.metadata.subtitle}</p>}
          {!volume.series.isOneshot && (
            <div className="py-2">
              <Link href={`/${lang}/books/${volume.series.slug}`} className="italic hover:underline">
                {books.series} {volume.series.title}
              </Link>
            </div>
          )}

          <BookReaderButton slug={volume.slug} title={volume.metadata.title} layout={volume.metadata.renditionLayout} intl={intl} />

          <BookMetadataBadges metadata={volume.metadata} intl={intl} />

          <p className="mt-4">
            {getBookPublicationYear(volume.metadata.publishedAt ?? volume.metadata.modifiedAt)}
            {volume.number !== null ? <> &bull; {books.book} {volume.number}</> : null}
          </p>

          {description && (
            <>
              <h2 className="text-sm mt-8 mb-1">{books.synopsis}</h2>
              <BookSummary summary={description} intl={intl} />
            </>
          )}

          <Tabs tabs={[
            { label: books.details, content: <BookMetadataPanel volume={volume} intl={intl} /> },
            { label: books.readingHistory, content: <p className="text-neutral-400">{books.readingHistoryDescription}</p> },
          ]} />
          {isAdmin && <><Separator /><BookAdminActions type="volume" slug={volume.slug} lang={lang} intl={intl} canDownload={process.env.LIB_PROVIDER === "cloud"} /></>}
        </div>
      </section>
    </div>
  );
}
