import AdmZip from "adm-zip";
import path from "node:path";
import xml2js from "xml2js";
import type {
  EpubMetadata,
  EpubParseResult,
  EpubPerson,
} from "./types";

type XmlValue = string | { _: string; $?: Record<string, string> };
type XmlRecord = Record<string, XmlValue | XmlValue[] | Record<string, unknown> | Record<string, unknown>[]>;

const xmlParser = new xml2js.Parser({ explicitArray: false, trim: true });

function values(input: unknown): XmlValue[] {
  if (!input) return [];
  return Array.isArray(input) ? input as XmlValue[] : [input as XmlValue];
}

function xmlText(value: XmlValue | undefined): string | null {
  if (typeof value === "string") return value.trim() || null;
  return value?._?.trim() || null;
}

function attrs(value: XmlValue | undefined): Record<string, string> {
  return typeof value === "object" && value ? value.$ ?? {} : {};
}

function firstText(record: XmlRecord, name: string): string | null {
  return xmlText(values(record[name])[0]);
}

function safeArchivePath(input: string): string {
  const normalized = path.posix.normalize(input.replace(/\\/g, "/"));
  if (!normalized || normalized === "." || normalized.startsWith("../") || normalized.startsWith("/")) {
    throw new Error("Invalid EPUB resource path");
  }
  return normalized;
}

function resolveArchivePath(base: string, relative: string): string {
  return safeArchivePath(path.posix.join(path.posix.dirname(base), relative));
}

function roleByRefines(metadata: XmlRecord): Map<string, string> {
  const roles = new Map<string, string>();
  for (const entry of values(metadata.meta)) {
    const attributes = attrs(entry);
    if (attributes.property !== "role" || !attributes.refines) continue;
    const role = xmlText(entry);
    if (role) roles.set(attributes.refines.replace(/^#/, ""), role);
  }
  return roles;
}

function parsePeople(metadata: XmlRecord): EpubPerson[] {
  const roles = roleByRefines(metadata);
  const people: EpubPerson[] = [];
  for (const kind of ["creator", "contributor"] as const) {
    values(metadata[`dc:${kind}`]).forEach((entry, position) => {
      const name = xmlText(entry);
      if (!name) return;
      const attributes = attrs(entry);
      people.push({
        name,
        role: roles.get(attributes.id ?? "") ?? attributes.role ?? null,
        kind,
        sortName: attributes["file-as"] ?? null,
        position,
      });
    });
  }
  return people;
}

function parseMetadata(packagePath: string, parsed: Record<string, unknown>): EpubMetadata {
  const pkg = parsed.package as XmlRecord | undefined;
  const metadata = pkg?.metadata as XmlRecord | undefined;
  const manifest = pkg?.manifest as XmlRecord | undefined;
  if (!metadata || !manifest) throw new Error("EPUB package document is missing metadata or manifest");

  const primaryIdentifier = attrs(values(metadata["dc:identifier"])[0]).id;
  const identifiers = values(metadata["dc:identifier"])
    .reduce<EpubMetadata["identifiers"]>((items, entry) => {
      const value = xmlText(entry);
      if (value && !items.some((item) => item.value === value)) {
        items.push({ value, scheme: attrs(entry).scheme ?? attrs(entry)["opf:scheme"] ?? null, isPrimary: attrs(entry).id === primaryIdentifier });
      }
      return items;
    }, []);

  const manifestItems = values(manifest.item).map((item) => attrs(item));
  const legacyCoverId = values(metadata.meta)
    .map((entry) => attrs(entry))
    .find((entry) => entry.name === "cover")?.content;
  const coverItem = manifestItems.find((item) => item.properties?.split(/\s+/).includes("cover-image"))
    ?? manifestItems.find((item) => item.id === legacyCoverId);
  const navItem = manifestItems.find((item) => item.properties?.split(/\s+/).includes("nav"))
    ?? manifestItems.find((item) => item["media-type"] === "application/x-dtbncx+xml");
  const rendition = new Map(
    values(metadata.meta)
      .map((entry) => [attrs(entry).property, xmlText(entry)] as const)
      .filter((entry): entry is [string, string] => Boolean(entry[0] && entry[1])),
  );
  const title = firstText(metadata, "dc:title");
  if (!title) throw new Error("EPUB is missing dc:title");

  return {
    title,
    subtitle: values(metadata["dc:title"])
      .slice(1)
      .map(xmlText)
      .find(Boolean) ?? null,
    description: firstText(metadata, "dc:description"),
    publisher: firstText(metadata, "dc:publisher"),
    publishedAt: firstText(metadata, "dc:date"),
    language: firstText(metadata, "dc:language"),
    rights: firstText(metadata, "dc:rights"),
    source: firstText(metadata, "dc:source"),
    publicationType: firstText(metadata, "dc:type"),
    modifiedAt: rendition.get("dcterms:modified") ?? null,
    packagePath,
    navigationPath: navItem?.href ? resolveArchivePath(packagePath, navItem.href) : null,
    coverPath: coverItem?.href ? resolveArchivePath(packagePath, coverItem.href) : null,
    renditionLayout: rendition.get("rendition:layout") === "pre-paginated" ? "pre-paginated" : "reflowable",
    renditionFlow: rendition.get("rendition:flow") ?? null,
    renditionOrientation: rendition.get("rendition:orientation") ?? null,
    renditionSpread: rendition.get("rendition:spread") ?? null,
    identifiers,
    people: parsePeople(metadata),
    subjects: values(metadata["dc:subject"]).reduce<EpubMetadata["subjects"]>((items, entry) => {
      const name = xmlText(entry);
      if (name && !items.some((item) => item.name === name)) items.push({ name, scheme: attrs(entry).scheme ?? null });
      return items;
    }, []),
  };
}

export async function parseEpubBuffer(buffer: Buffer): Promise<EpubParseResult> {
  const zip = new AdmZip(buffer);
  const containerEntry = zip.getEntry("META-INF/container.xml");
  if (!containerEntry) throw new Error("Invalid EPUB: META-INF/container.xml was not found");

  const container = await xmlParser.parseStringPromise(containerEntry.getData().toString("utf8")) as Record<string, unknown>;
  const rootfiles = ((container.container as XmlRecord | undefined)?.rootfiles as XmlRecord | undefined)?.rootfile;
  const rootfile = values(rootfiles)[0];
  const packagePath = attrs(rootfile)["full-path"];
  if (!packagePath) throw new Error("Invalid EPUB: package document is missing");
  const safePackagePath = safeArchivePath(packagePath);
  const packageEntry = zip.getEntry(safePackagePath);
  if (!packageEntry) throw new Error("Invalid EPUB: package document was not found");

  const packageDocument = await xmlParser.parseStringPromise(packageEntry.getData().toString("utf8")) as Record<string, unknown>;
  const metadata = parseMetadata(safePackagePath, packageDocument);
  const coverEntry = metadata.coverPath ? zip.getEntry(metadata.coverPath) : null;
  const cover = coverEntry
    ? { path: metadata.coverPath!, data: coverEntry.getData(), mediaType: null }
    : null;

  return { metadata, cover };
}

export function getEpubEntry(buffer: Buffer, entryPath: string): Buffer | null {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry(safeArchivePath(entryPath));
  return entry ? entry.getData() : null;
}
