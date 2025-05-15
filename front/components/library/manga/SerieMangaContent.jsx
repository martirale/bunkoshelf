import Image from "next/image";
import MangaCard from "@/ui/library/manga/MangaCard";
import ReadButtonsSeries from "./ReadButtonsSeries";

export default function SerieMangaContent({
  serieData,
  lang,
  intl,
  isFavorite,
}) {
  const coverImage = serieData.volumes?.[0]?.coverImage ?? null;

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
            {serieData.title}
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
            <span className="text-xs uppercase border border-sand rounded-md px-3 py-1 mr-3">
              20XX
            </span>
            <span className="text-xs uppercase border border-sand rounded-md px-3 py-1 mr-3">
              13+
            </span>
            <span className="text-xs uppercase border border-sand rounded-md px-3 py-1 mr-3">
              Lang
            </span>
            <span className="text-xs uppercase border border-sand rounded-md px-3 py-1">
              Oriental
            </span>
          </div>

          {/* Volumes */}
          <p className="mt-4">
            {serieData.volumes.length} {intl.manga.volumes}
          </p>

          {/* Description */}
          <div className="mt-8 max-w-2xl">
            <h2 className="text-sm mb-1">{intl.manga.synopsis}</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi
              vitae orci fringilla eros tristique scelerisque. Phasellus sit
              amet metus sit amet dui egestas dictum. Curabitur ac purus metus.
              Morbi blandit nec felis ut interdum. Etiam luctus, magna et
              bibendum eleifend, enim sapien tincidunt nisi, non egestas nisl
              leo ullamcorper nunc.
            </p>
          </div>

          <div className="border-t border-zinc-800 my-6"></div>

          {/* Author Info */}
          <div className="flex flex-row items-baseline max-w-3xl">
            <p className="text-sm uppercase w-1/3 md:w-1/5">
              {intl.manga.author}
            </p>
            <p className="w-2/3 md:w-4/5">Lorem Ipsum</p>
          </div>

          <div className="flex flex-row items-baseline max-w-3xl">
            <p className="text-sm uppercase w-1/3 md:w-1/5">
              {intl.manga.cartoonist}
            </p>
            <p className="w-2/3 md:w-4/5">Lorem Ipsum</p>
          </div>

          <div className="flex flex-row items-baseline max-w-3xl">
            <p className="text-sm uppercase w-1/3 md:w-1/5">
              {intl.manga.editorial}
            </p>
            <p className="w-2/3 md:w-4/5">Lorem Ipsum</p>
          </div>

          <div className="flex flex-row items-baseline max-w-3xl">
            <p className="text-sm uppercase w-1/3 md:w-1/5">
              {intl.manga.genre}
            </p>
            <p className="w-2/3 md:w-4/5">Lorem Ipsum</p>
          </div>

          <div className="flex flex-row items-baseline max-w-3xl">
            <p className="text-sm uppercase w-1/3 md:w-1/5">
              {intl.manga.tags}
            </p>
            <p className="w-2/3 md:w-4/5">Lorem Ipsum</p>
          </div>
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
      </section>
    </div>
  );
}
