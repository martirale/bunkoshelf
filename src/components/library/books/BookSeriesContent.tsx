import Image from "next/image";
import MangaCard from "@/components/ui/MangaCard";
import Separator from "@/components/ui/Separator";
import BookReaderButton from "./BookReaderButton";
import BookMetadataPanel from "./BookMetadataPanel";
import { getBookCoverUrl } from "@/lib/books/cover";
import type { BookVolume } from "@/lib/db/books/library";
import type { Dictionary, Locale } from "@/lib/types";

interface BookSeriesContentProps {
  volumes: BookVolume[];
  lang: Locale;
  intl: Dictionary;
  progressById: Record<string, { isRead: boolean; progression: number | null }>;
}

export default function BookSeriesContent({ volumes, lang, intl, progressById }: BookSeriesContentProps) {
  const firstVolume = volumes[0];
  const coverImage = getBookCoverUrl(firstVolume.slug, firstVolume.metadata.coverPath);
  const meta = firstVolume.metadata;

  return (
    <div className="p-4">
      <section className="flex flex-col md:flex-row">
        <div className="w-full md:w-5/12 2xl:w-1/3">
          <div className="mb-8 md:mb-0 md:mr-4 px-16 md:px-0 md:sticky md:top-4 md:self-start">
            {coverImage ? (
              <Image src={coverImage} alt={`Cover for ${firstVolume.series.title}`} width={0} height={0} sizes="100vw" className="w-full h-auto object-contain rounded-lg" />
            ) : (
              <div className="aspect-[7/10.5] grid place-items-center rounded-lg bg-sand p-6 text-center text-onix">Sin portada</div>
            )}
          </div>
        </div>
        <div className="w-full md:w-7/12 2xl:w-2/3 2xl:pl-4">
          <h1 className="text-2xl leading-11 md:text-3xl md:leading-14">{firstVolume.series.title}</h1>
          <BookReaderButton slug={firstVolume.slug} title={firstVolume.metadata.title} layout={firstVolume.metadata.renditionLayout} />
          <div className="mt-8">
            <span className="text-sm uppercase bg-neutral-700 rounded-md px-3 py-1 mr-2">{meta.language || "und"}</span>
            <span className="text-sm uppercase bg-neutral-700 rounded-md px-3 py-1">{meta.renditionLayout === "pre-paginated" ? "Maquetación fija" : "Texto refluible"}</span>
          </div>
          <p className="mt-4">{meta.publishedAt || ""} &bull; {volumes.length} {intl.manga.volumes as string}</p>
          {meta.description && (
            <>
              <h2 className="text-sm mt-8 mb-1">{intl.manga.synopsis as string} (vol. 1)</h2>
              <p className="whitespace-pre-line leading-relaxed">{meta.description}</p>
            </>
          )}
          <Separator />
          <BookMetadataPanel volume={firstVolume} />
        </div>
      </section>
      <section>
        <Separator />
        <h2>{intl.manga.seriesVolumes as string}</h2>
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
              progressRatio={progressById[volume.id]?.progression ?? null}
              offlineVolumeId={volume.id}
              intl={intl}
              className="font-roboto font-bold leading-5 2xl:leading-5.5 text-base 2xl:text-lg"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
