import Link from "next/link";
import type { LibrarySection } from "@/lib/librarySection";
import { normalizeCommaSeparatedText } from "@/lib/utils";
import type { Locale, Dictionary } from "@/lib/types";

function normalize(field: unknown): string | null {
  if (!field) return null;
  if (Array.isArray(field)) {
    return normalizeCommaSeparatedText(field);
  }
  if (typeof field === "string") {
    return normalizeCommaSeparatedText(field);
  }
  return String(field);
}

interface MetaFieldProps {
  field: unknown;
  label: unknown;
}

function MetaField({ field, label }: MetaFieldProps) {
  const value = normalize(field);
  if (!value) return null;
  return (
    <div className="flex flex-row items-baseline max-w-3xl">
      <p className="text-sm uppercase w-1/3 md:w-1/5">{label as string}</p>
      <p className="w-2/3 md:w-4/5">{value}</p>
    </div>
  );
}

interface MetadataPanelProps {
  meta: Record<string, unknown>;
  lang: Locale;
  intl: Dictionary;
  linkBase?: string;
  section?: LibrarySection;
}

export default function MetadataPanel({
  meta,
  lang,
  intl,
  linkBase = "volumes",
  section = "manga",
}: MetadataPanelProps) {
  const genres = (meta.genres || []) as { name: string }[];
  const tags = (meta.tags || []) as { name: string }[];

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

      {genres.length > 0 && (
        <div className="flex flex-row items-baseline max-w-3xl mt-8">
          <p className="text-sm uppercase w-1/3 md:w-1/5">
            {intl.manga.genre as string}
          </p>
          <div className="w-2/3 md:w-4/5 flex flex-wrap gap-2">
            {genres.map((genre, idx) => (
              <Link
                key={idx}
                href={{
                  pathname: `/${lang}/${section}/${linkBase}`,
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

      {tags.length > 0 && (
        <div className="flex flex-row items-baseline max-w-3xl mt-2">
          <p className="text-sm uppercase w-1/3 md:w-1/5">
            {intl.manga.tags as string}
          </p>
          <div className="w-2/3 md:w-4/5 flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
              <Link
                key={idx}
                href={{
                  pathname: `/${lang}/${section}/${linkBase}`,
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
