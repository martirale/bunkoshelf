import type { BookVolume } from "@/lib/db/books/library";

export default function BookMetadataPanel({ volume }: { volume: BookVolume }) {
  const { metadata } = volume;
  const people = metadata.people.map((person) => person.role ? `${person.name} (${person.role})` : person.name).join(", ");
  const identifiers = metadata.identifiers.map((identifier) => `${identifier.scheme || "ID"}: ${identifier.value}`).join(", ");

  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-3 text-base">
      {people && <><dt className="text-sm uppercase text-neutral-400">Autoría</dt><dd>{people}</dd></>}
      {metadata.publisher && <><dt className="text-sm uppercase text-neutral-400">Editorial</dt><dd>{metadata.publisher}</dd></>}
      {metadata.publicationType && <><dt className="text-sm uppercase text-neutral-400">Formato</dt><dd>{metadata.publicationType}</dd></>}
      {identifiers && <><dt className="text-sm uppercase text-neutral-400">Identificador</dt><dd>{identifiers}</dd></>}
      {metadata.rights && <><dt className="text-sm uppercase text-neutral-400">Derechos</dt><dd>{metadata.rights}</dd></>}
      {metadata.subjects.length > 0 && <><dt className="text-sm uppercase text-neutral-400">Temas</dt><dd className="flex flex-wrap gap-2">{metadata.subjects.map((subject) => <span key={subject.name} className="text-sm uppercase bg-neutral-700 rounded-md px-3 py-1">{subject.name}</span>)}</dd></>}
    </dl>
  );
}
