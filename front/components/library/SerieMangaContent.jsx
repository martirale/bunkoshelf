import Link from "next/link";

export default function SerieMangaContent({ serieData, lang, intl }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{serieData.title}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {serieData.volumes && serieData.volumes.length > 0 ? (
          serieData.volumes.map((volume, idx) => (
            <Link
              key={idx}
              href={`/${lang}/manga/volume/${volume.slug}`}
              className="border rounded p-2 hover:shadow transition"
            >
              <div className="text-sm font-medium">{volume.filename}</div>
            </Link>
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
