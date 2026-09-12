import type { ReactNode } from "react";
import { getBookIdentifierScheme, getBookIdentifierValue, getBookPersonRole } from "@/lib/books/metadata";
import type { BookVolume } from "@/lib/db/books/library";

function MetadataField({ label, children }: { label: string; children: ReactNode }) {
  return <><dt className="text-sm uppercase text-neutral-400">{label}</dt><dd>{children}</dd></>;
}

export default function BookMetadataPanel({ volume }: { volume: BookVolume }) {
  const { metadata } = volume;
  const authors = metadata.people.filter((person) => person.kind === "creator" && (!person.role || person.role.toLowerCase() === "aut"));
  const contributors = metadata.people.filter((person) => !authors.includes(person));
  const contributorsByRole = contributors.reduce<Map<string, typeof contributors>>((groups, person) => {
    const role = getBookPersonRole(person.role) ?? "Contribución";
    groups.set(role, [...(groups.get(role) ?? []), person]);
    return groups;
  }, new Map());

  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-3 text-base">
      {authors.length > 0 && <MetadataField label="Autoría">{authors.map((person) => person.name).join(", ")}</MetadataField>}
      {[...contributorsByRole].map(([role, people]) => (
        <MetadataField key={role} label={role}>{people.map((person) => person.name).join(", ")}</MetadataField>
      ))}
      {metadata.publisher && <MetadataField label="Editorial">{metadata.publisher}</MetadataField>}
      <MetadataField label="Formato">EPUB{metadata.publicationType ? ` · ${metadata.publicationType}` : ""}</MetadataField>
      {metadata.identifiers.length > 0 && <MetadataField label="Identificadores"><div className="space-y-1">{metadata.identifiers.map((identifier) => <p key={identifier.value}>{getBookIdentifierScheme(identifier.value, identifier.scheme)}: {getBookIdentifierValue(identifier.value, identifier.scheme)}</p>)}</div></MetadataField>}
      {metadata.rights && <MetadataField label="Derechos">{metadata.rights}</MetadataField>}
      {metadata.source && <MetadataField label="Fuente">{metadata.source}</MetadataField>}
      {metadata.subjects.length > 0 && <MetadataField label="Temas"><span className="flex flex-wrap gap-2">{metadata.subjects.map((subject) => <span key={subject.name} className="rounded-md bg-neutral-700 px-3 py-1 text-sm uppercase">{subject.name}</span>)}</span></MetadataField>}
    </dl>
  );
}
