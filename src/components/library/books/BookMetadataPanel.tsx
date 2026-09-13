import type { ReactNode } from "react";
import Link from "next/link";
import { getBookIdentifierScheme, getBookIdentifierValue } from "@/lib/books/metadata";
import type { BookVolume } from "@/lib/db/books/library";
import type { Dictionary, Locale } from "@/lib/types";

function MetadataField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex max-w-3xl flex-row items-baseline">
      <p className="w-1/3 text-sm uppercase md:w-1/5">{label}</p>
      <div className="w-2/3 md:w-4/5">{children}</div>
    </div>
  );
}

export default function BookMetadataPanel({
  volume,
  lang,
  intl,
}: {
  volume: BookVolume;
  lang: Locale;
  intl: Dictionary;
}) {
  const books = intl.books as Record<string, string>;
  const { metadata } = volume;
  const authors = metadata.people.filter((person) => person.kind === "creator" && (!person.role || person.role.toLowerCase() === "aut"));
  const contributors = metadata.people.filter((person) => !authors.includes(person));
  const isbnIdentifiers = metadata.identifiers.filter((identifier) => getBookIdentifierScheme(identifier.value, identifier.scheme) === "ISBN");
  const roleLabels: Record<string, string> = {
    aut: books.author,
    bkp: books.digitalProduction,
    bjd: books.design,
    bkd: books.design,
    cmp: books.composition,
    cov: books.design,
    dsr: books.design,
    edt: books.editing,
    ill: books.illustration,
    nrt: books.narration,
    pht: books.photography,
    tyd: books.design,
    trl: books.translation,
  };
  const contributorsByRole = contributors.reduce<Map<string, typeof contributors>>((groups, person) => {
    const role = person.role ? roleLabels[person.role.toLowerCase()] ?? books.contribution : books.contribution;
    groups.set(role, [...(groups.get(role) ?? []), person]);
    return groups;
  }, new Map());

  return (
    <div>
      {authors.length > 0 && (
        <MetadataField label={books.author}>
          {authors.map((person, index) => (
            <span key={`${person.name}-${person.position}`}>
              {index > 0 && ", "}
              <Link
                href={{ pathname: `/${lang}/books/series`, query: { author: person.name, includeOneshots: "true" } }}
                className="transition-all duration-300 hover:text-lilah"
              >
                {person.name}
              </Link>
            </span>
          ))}
        </MetadataField>
      )}
      {[...contributorsByRole].map(([role, people]) => (
        <MetadataField key={role} label={role}>{people.map((person) => person.name).join(", ")}</MetadataField>
      ))}
      {metadata.publisher && <MetadataField label={books.publisher}>{metadata.publisher}</MetadataField>}
      <MetadataField label={books.format}>EPUB{metadata.publicationType ? ` · ${metadata.publicationType}` : ""}</MetadataField>
      {isbnIdentifiers.length > 0 && <MetadataField label="ISBN"><div className="space-y-1">{isbnIdentifiers.map((identifier) => <p key={identifier.value}>{getBookIdentifierValue(identifier.value, identifier.scheme)}</p>)}</div></MetadataField>}
      {metadata.rights && <MetadataField label={books.rights}>{metadata.rights}</MetadataField>}
      {metadata.source && <MetadataField label={books.source}>{metadata.source}</MetadataField>}
      {metadata.subjects.length > 0 && (
        <div className="mt-8 flex max-w-3xl flex-row items-baseline">
          <p className="w-1/3 text-sm uppercase md:w-1/5">{books.subjects}</p>
          <div className="flex w-2/3 flex-wrap gap-2 md:w-4/5">
            {metadata.subjects.map((subject) => <span key={subject.name} className="rounded-md bg-neutral-700 px-2 py-1 text-xs uppercase">{subject.name}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
