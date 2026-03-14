import Link from "next/link";

function normalize(field) {
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
}

function MetaField({ field, label }) {
  const value = normalize(field);
  if (!value) return null;
  return (
    <div className="flex flex-row items-baseline max-w-3xl">
      <p className="text-sm uppercase w-1/3 md:w-1/5">{label}</p>
      <p className="w-2/3 md:w-4/5">{value}</p>
    </div>
  );
}

export default function MetadataPanel({ meta, lang, intl, linkBase = "volumes" }) {
  return (
    <>
      <MetaField field={meta.writer} label={intl.manga.author} />
      <MetaField field={meta.penciller} label={intl.manga.penciller} />
      <MetaField field={meta.inker} label={intl.manga.inker} />
      <MetaField field={meta.colorist} label={intl.manga.colorist} />
      <MetaField field={meta.letterer} label={intl.manga.letterer} />
      <MetaField field={meta.coverArtist} label={intl.manga.coverArtist} />
      <MetaField field={meta.editor} label={intl.manga.editor} />
      <MetaField field={meta.publisher} label={intl.manga.publisher} />
      <MetaField field={meta.imprint} label={intl.manga.imprint} />
      <MetaField field={meta.format} label={intl.manga.format} />
      <MetaField field={meta.gtin} label={intl.manga.gtin} />

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
                  pathname: `/${lang}/manga/${linkBase}`,
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
                  pathname: `/${lang}/manga/${linkBase}`,
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
    </>
  );
}
