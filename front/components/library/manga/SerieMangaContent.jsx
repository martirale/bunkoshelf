import Link from "next/link";
import MangaCard from "@/ui/library/manga/MangaCard";

export default function SerieMangaContent({ serieData, lang, intl }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{serieData.title}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {serieData.volumes && serieData.volumes.length > 0 ? (
          serieData.volumes.map((volume, idx) => (
            <MangaCard
              key={idx}
              title={volume.title || volume.filename}
              href={`/${lang}/manga/volume/${volume.slug}`}
              isSeries={false}
              volumeCount={null}
              cover={volume.coverImage ?? null}
              intl={intl}
              className="text-xs leading-6 2xl:text-sm 2xl:leading-6.5"
            />
          ))
        ) : (
          <div>
            {intl?.library?.noVolumes ||
              "No hay volúmenes disponibles para esta serie."}
          </div>
        )}
      </div>
    </div>
  );
}
