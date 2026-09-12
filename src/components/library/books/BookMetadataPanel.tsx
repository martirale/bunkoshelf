import type { ReactNode } from "react";
import { getBookIdentifierScheme, getBookIdentifierValue, getBookPersonRole } from "@/lib/books/metadata";
import type { BookVolume } from "@/lib/db/books/library";

function MetadataField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex max-w-3xl flex-row items-baseline">
      <p className="w-1/3 text-sm uppercase md:w-1/5">{label}</p>
      <div className="w-2/3 md:w-4/5">{children}</div>
    </div>
  );
}

export default function BookMetadataPanel({ volume }: { volume: BookVolume }) {
  const { metadata } = volume;
  const authors = metadata.people.filter((person) => person.kind === "creator" && (!person.role || person.role.toLowerCase() === "aut"));
  const contributors = metadata.people.filter((person) => !authors.includes(person));
  const isbnIdentifiers = metadata.identifiers.filter((identifier) => getBookIdentifierScheme(identifier.value, identifier.scheme) === "ISBN");
  const contributorsByRole = contributors.reduce<Map<string, typeof contributors>>((groups, person) => {
    const role = getBookPersonRole(person.role) ?? "Contribución";
    groups.set(role, [...(groups.get(role) ?? []), person]);
    return groups;
  }, new Map());

  return (
    <div>
      {authors.length > 0 && <MetadataField label="Autoría">{authors.map((person) => person.name).join(", ")}</MetadataField>}
      {[...contributorsByRole].map(([role, people]) => (
        <MetadataField key={role} label={role}>{people.map((person) => person.name).join(", ")}</MetadataField>
      ))}
      {metadata.publisher && <MetadataField label="Editorial">{metadata.publisher}</MetadataField>}
      <MetadataField label="Formato">EPUB{metadata.publicationType ? ` · ${metadata.publicationType}` : ""}</MetadataField>
      {isbnIdentifiers.length > 0 && <MetadataField label="ISBN"><div className="space-y-1">{isbnIdentifiers.map((identifier) => <p key={identifier.value}>{getBookIdentifierValue(identifier.value, identifier.scheme)}</p>)}</div></MetadataField>}
      {metadata.rights && <MetadataField label="Derechos">{metadata.rights}</MetadataField>}
      {metadata.source && <MetadataField label="Fuente">{metadata.source}</MetadataField>}
      {metadata.subjects.length > 0 && (
        <div className="mt-8 flex max-w-3xl flex-row items-baseline">
          <p className="w-1/3 text-sm uppercase md:w-1/5">Temas</p>
          <div className="flex w-2/3 flex-wrap gap-2 md:w-4/5">
            {metadata.subjects.map((subject) => <span key={subject.name} className="rounded-md bg-neutral-700 px-2 py-1 text-xs uppercase">{subject.name}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
