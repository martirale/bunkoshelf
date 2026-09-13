import AdmZip from "adm-zip";
import path from "node:path";
import xml2js from "xml2js";
import type {
  EpubCollection,
  EpubMetadata,
  EpubParseResult,
  EpubPerson,
} from "./types";
import { getBookIdentifierScheme, normalizeBookAgeRating, toPlainBookText } from "./metadata.ts";

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
  const resource = relative.split(/[?#]/, 1)[0];
  return safeArchivePath(path.posix.join(path.posix.dirname(base), resource));
}

function findGuideCoverReference(parsed: Record<string, unknown>): string | null {
  const pkg = parsed.package as XmlRecord | undefined;
  const guide = pkg?.guide as XmlRecord | undefined;
  const cover = values(guide?.reference)
    .map((entry) => attrs(entry))
    .find((entry) => entry.type?.split(/\s+/).some((type) => type.toLowerCase() === "cover"));
  return cover?.href ?? null;
}

function findCoverResourceReference(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const resource = findCoverResourceReference(item);
      if (resource) return resource;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;

  for (const [name, child] of Object.entries(value)) {
    if (name === "$" || name === "_") continue;
    const element = name.split(":").at(-1)?.toLowerCase();
    if (element === "img" || element === "image" || element === "object") {
      for (const entry of values(child)) {
        const attributes = attrs(entry);
        const resource = attributes.src ?? attributes.href ?? attributes["xlink:href"] ?? attributes.data;
        if (resource && !/^(?:data:|https?:)/i.test(resource)) return resource;
      }
    }
    const resource = findCoverResourceReference(child);
    if (resource) return resource;
  }
  return null;
}

async function resolveCoverPath(zip: AdmZip, packagePath: string, reference: string | null): Promise<string | null> {
  if (!reference) return null;
  let directPath: string | null = null;
  try {
    directPath = safeArchivePath(reference.split(/[?#]/, 1)[0]);
  } catch {
    directPath = null;
  }
  const coverPath = directPath && zip.getEntry(directPath) ? directPath : resolveArchivePath(packagePath, reference);
  const coverEntry = zip.getEntry(coverPath);
  if (!coverEntry) return null;
  if (!/\.(?:x?html?)$/i.test(coverPath)) return coverPath;

  const coverDocument = await xmlParser.parseStringPromise(coverEntry.getData().toString("utf8")) as Record<string, unknown>;
  const resource = findCoverResourceReference(coverDocument);
  if (!resource) return null;
  const imagePath = resolveArchivePath(coverPath, resource);
  return zip.getEntry(imagePath) ? imagePath : null;
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

function identifierTypeByRefines(metadata: XmlRecord): Map<string, string> {
  const types = new Map<string, string>();
  for (const entry of values(metadata.meta)) {
    const attributes = attrs(entry);
    if (attributes.property !== "identifier-type" || !attributes.refines) continue;
    const value = xmlText(entry)?.trim();
    if (!value) continue;
    const scheme = attributes.scheme?.toLowerCase();
    if ((scheme === "onix:codelist5" && value === "15") || value.toLowerCase() === "isbn") {
      types.set(attributes.refines.replace(/^#/, ""), "ISBN");
    }
  }
  return types;
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
        role: roles.get(attributes.id ?? "") ?? attributes.role ?? attributes["opf:role"] ?? null,
        kind,
        sortName: attributes["file-as"] ?? attributes["opf:file-as"] ?? null,
        position,
      });
    });
  }
  return people;
}

function propertyValues(metadata: XmlRecord): Map<string, string> {
  return new Map(
    values(metadata.meta)
      .map((entry) => [attrs(entry).property, xmlText(entry)] as const)
      .filter((entry): entry is [string, string] => Boolean(entry[0] && entry[1])),
  );
}

function namedMetaValues(metadata: XmlRecord): Map<string, string> {
  return new Map(
    values(metadata.meta)
      .map((entry) => [attrs(entry).name, attrs(entry).content] as const)
      .filter((entry): entry is [string, string] => Boolean(entry[0] && entry[1])),
  );
}

function collectionType(value: string | null | undefined): EpubCollection["type"] {
  const normalized = value?.trim().toLowerCase();
  return normalized === "series" || normalized === "set" ? normalized : null;
}

function collectionPosition(value: string | null | undefined): number | null {
  if (!value) return null;
  const position = Number(value.trim().replace(",", "."));
  return Number.isFinite(position) && position >= 0 ? position : null;
}

function parseCollection(metadata: XmlRecord, namedMeta: Map<string, string>): EpubCollection | null {
  const entries = values(metadata.meta);
  const epub3Collections = entries.flatMap((entry, index) => {
    const attributes = attrs(entry);
    const title = xmlText(entry);
    if (attributes.property !== "belongs-to-collection" || !title) return [];
    const id = attributes.id;
    const refinements = id
      ? entries.filter((candidate) => attrs(candidate).refines?.replace(/^#/, "") === id)
      : [];
    const valueFor = (property: string) => xmlText(refinements.find((candidate) => attrs(candidate).property === property));
    return [{
      title,
      type: collectionType(valueFor("collection-type")),
      position: collectionPosition(valueFor("group-position")),
      index,
    }];
  });

  if (epub3Collections.length > 0) {
    epub3Collections.sort((a, b) => {
      const priority = (type: EpubCollection["type"]) => type === "series" ? 0 : type === "set" ? 1 : 2;
      return priority(a.type) - priority(b.type) || a.index - b.index;
    });
    const { title, type, position } = epub3Collections[0];
    return { title, type, position };
  }

  const title = namedMeta.get("bunko:series")?.trim();
  if (!title) return null;
  return {
    title,
    type: collectionType(namedMeta.get("bunko:series-type") ?? "series"),
    position: collectionPosition(namedMeta.get("bunko:series-position")),
  };
}

function parseTitles(metadata: XmlRecord): { title: string; subtitle: string | null } {
  const titles = values(metadata["dc:title"]);
  const titleTypes = new Map(
    values(metadata.meta)
      .map((entry) => [attrs(entry).refines?.replace(/^#/, ""), attrs(entry).property, xmlText(entry)] as const)
      .filter((entry): entry is [string, string, string] => entry[1] === "title-type" && Boolean(entry[0] && entry[2]))
      .map(([id, , value]) => [id, value]),
  );
  const mainEntry = titles.find((entry) => titleTypes.get(attrs(entry).id ?? "") === "main") ?? titles[0];
  const title = xmlText(mainEntry);
  if (!title) throw new Error("EPUB is missing dc:title");
  const subtitle = titles
    .filter((entry) => entry !== mainEntry)
    .find((entry) => titleTypes.get(attrs(entry).id ?? "") === "subtitle")
    ?? titles.find((entry) => entry !== mainEntry);
  return { title, subtitle: xmlText(subtitle) };
}

function parseMetadata(packagePath: string, parsed: Record<string, unknown>): EpubMetadata {
  const pkg = parsed.package as XmlRecord | undefined;
  const metadata = pkg?.metadata as XmlRecord | undefined;
  const manifest = pkg?.manifest as XmlRecord | undefined;
  if (!metadata || !manifest) throw new Error("EPUB package document is missing metadata or manifest");

  const primaryIdentifier = attrs(values(metadata["dc:identifier"])[0]).id;
  const refinedIdentifierTypes = identifierTypeByRefines(metadata);
  const identifiers = values(metadata["dc:identifier"])
    .reduce<EpubMetadata["identifiers"]>((items, entry) => {
      const value = xmlText(entry);
      if (value && !items.some((item) => item.value === value)) {
        const attributes = attrs(entry);
        const scheme = refinedIdentifierTypes.get(attributes.id ?? "") ?? attributes.scheme ?? attributes["opf:scheme"] ?? null;
        items.push({ value, scheme: getBookIdentifierScheme(value, scheme), isPrimary: attributes.id === primaryIdentifier });
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
  const rendition = propertyValues(metadata);
  const namedMeta = namedMetaValues(metadata);
  const collection = parseCollection(metadata, namedMeta);
  const { title, subtitle } = parseTitles(metadata);
  const epubVersion = attrs(pkg).version?.trim().split(".")[0];

  return {
    title,
    subtitle,
    description: toPlainBookText(firstText(metadata, "dc:description")),
    publisher: firstText(metadata, "dc:publisher"),
    publishedAt: firstText(metadata, "dc:date"),
    language: firstText(metadata, "dc:language"),
    rights: firstText(metadata, "dc:rights"),
    source: firstText(metadata, "dc:source"),
    publicationType: rendition.get("schema:bookFormat") ?? firstText(metadata, "dc:type"),
    epubVersion: epubVersion === "2" || epubVersion === "3" ? epubVersion : null,
    ageRating: normalizeBookAgeRating(rendition.get("schema:typicalAgeRange")
      ?? rendition.get("schema:contentRating")
      ?? rendition.get("schema:audience")
      ?? namedMeta.get("rating")
      ?? firstText(metadata, "dc:audience")),
    modifiedAt: rendition.get("dcterms:modified") ?? null,
    packagePath,
    navigationPath: navItem?.href ? resolveArchivePath(packagePath, navItem.href) : null,
    coverPath: coverItem?.href ? resolveArchivePath(packagePath, coverItem.href) : null,
    renditionLayout: rendition.get("rendition:layout") === "pre-paginated" ? "pre-paginated" : "reflowable",
    renditionFlow: rendition.get("rendition:flow") ?? null,
    renditionOrientation: rendition.get("rendition:orientation") ?? null,
    renditionSpread: rendition.get("rendition:spread") ?? null,
    collection,
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
  metadata.coverPath = await resolveCoverPath(
    zip,
    safePackagePath,
    metadata.coverPath ?? findGuideCoverReference(packageDocument),
  );
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
