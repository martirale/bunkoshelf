import type { EpubMetadata } from "./types";

type BookMetadata = Pick<EpubMetadata, "people" | "subjects" | "identifiers" | "publisher" | "rights" | "source" | "epubVersion" | "publicationType">;

export type BookSeriesMetadata = Pick<BookMetadata, "people" | "subjects" | "identifiers" | "publisher" | "rights" | "source"> & { formats: string[] };

function unique<T>(items: T[], getValue: (item: T) => string): T[] {
  const values = new Map<string, T>();
  for (const item of items) {
    const key = getValue(item).trim().toLowerCase();
    if (key && !values.has(key)) values.set(key, item);
  }
  return [...values.values()];
}

export function aggregateBookSeriesMetadata(volumes: BookMetadata[]): BookSeriesMetadata {
  function collect(field: "publisher" | "rights" | "source") {
    const values = volumes.map((volume) => volume[field]?.trim() ?? "").filter(Boolean);
    return unique(values, (value) => value).join(", ") || null;
  }

  const people = volumes.flatMap((volume) => volume.people)
    .filter((person) => person.name.trim())
    .map((person) => ({ ...person, name: person.name.trim(), role: person.role?.trim().toLowerCase() || null }));
  const subjects = volumes.flatMap((volume) => volume.subjects)
    .map((subject) => ({ ...subject, name: subject.name.trim() })).filter((subject) => subject.name);
  const identifiers = volumes.flatMap((volume) => volume.identifiers)
    .map((identifier) => ({ ...identifier, value: identifier.value.trim() })).filter((identifier) => identifier.value);
  const formats = volumes.map((volume) => `EPUB${volume.epubVersion ? ` ${volume.epubVersion}` : ""}${volume.publicationType?.trim() ? ` · ${volume.publicationType.trim()}` : ""}`);

  return {
    people: unique(people, (person) => JSON.stringify([person.name.toLowerCase(), person.kind, person.role ?? (person.kind === "creator" ? "aut" : "")])),
    subjects: unique(subjects, (subject) => subject.name),
    identifiers: unique(identifiers, (identifier) => JSON.stringify([identifier.value, identifier.scheme?.trim().toLowerCase() ?? ""])),
    publisher: collect("publisher"),
    rights: collect("rights"),
    source: collect("source"),
    formats: unique(formats, (format) => format),
  };
}
