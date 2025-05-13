import Image from "next/image";
import Link from "next/link";
import ReadButtonsVolume from "./ReadButtonsVolume";

export default function VolumeMangaContent({ volumeData, lang, intl }) {
  if (!volumeData) {
    return (
      <div className="text-center mt-8">
        {intl?.errors?.notFound ||
          "No se encontró información de este volumen."}
      </div>
    );
  }

  const isOneshot = volumeData.series?.isOneshot === true;
  const seriesTitle = volumeData.series?.title;
  const seriesSlug = volumeData.series?.slug;

  return (
    <div className="p-4">
      <section className="flex flex-col md:flex-row">
        {/* Cover Image */}
        <div className="w-full md:w-1/3">
          {volumeData.coverImage && (
            <div className="mb-8 md:mb-0 md:mr-8 px-8 md:px-0">
              <Image
                src={volumeData.coverImage || "/placeholder.svg?=v1"}
                alt={`Cover for ${volumeData.title || volumeData.filename}`}
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
          )}
        </div>

        <div className="w-full md:w-2/3">
          {/* Series Title */}
          <h1 className="text-3xl leading-14">{volumeData.title}</h1>
          {!isOneshot && (
            <Link href={`/${lang}/manga/${seriesSlug}`} className="italic">
              {intl.manga.series} {seriesTitle}
            </Link>
          )}

          {/* Read Buttons */}
          <ReadButtonsVolume lang={lang} intl={intl} />

          {/* Meta Tags */}
          <div className="mt-20">
            {isOneshot && (
              <span className="text-xs uppercase bg-lilah border border-lilah rounded-md px-3 py-1 mr-3">
                Oneshot
              </span>
            )}
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
    </div>
  );
}
