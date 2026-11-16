import AdmZip from "adm-zip";
import { createExtractorFromData } from "node-unrar-js";
import { loadUnrarWasmBinary } from "./unrar.ts";
import { restoreRarHeaders } from "./rarHeaders.ts";

const emptyXml = '<?xml version="1.0" encoding="utf-8"?>\n<ComicInfo>\n</ComicInfo>\n';

function isComicInfo(name: string) {
  return name.split(/[\\/]/).pop()?.toLowerCase() === "comicinfo.xml";
}

function isRar(data: Buffer) {
  return data.subarray(0, 6).equals(Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]));
}

async function openRar(data: Buffer) {
  const wasm = await loadUnrarWasmBinary();
  return createExtractorFromData({ data: Uint8Array.from(data).buffer, wasmBinary: Uint8Array.from(wasm).buffer });
}

export async function readComicInfoArchive(data: Buffer): Promise<{ xml: string; entryName: string }> {
  if (isRar(data)) {
    const extractor = await openRar(data);
    const entries = [...extractor.getFileList().fileHeaders].filter((entry) => !entry.flags.directory && isComicInfo(entry.name));
    if (entries.length > 1) throw new Error("duplicateXml");
    if (!entries[0]) return { xml: emptyXml, entryName: "ComicInfo.xml" };
    const files = [...extractor.extract({ files: [entries[0].name] }).files];
    if (!files[0]?.extraction) throw new Error("loadError");
    return { xml: Buffer.from(files[0].extraction).toString("utf8"), entryName: entries[0].name };
  }
  const zip = new AdmZip(data);
  const entries = zip.getEntries().filter((entry) => !entry.isDirectory && isComicInfo(entry.entryName));
  if (entries.length > 1) throw new Error("duplicateXml");
  return entries[0]
    ? { xml: entries[0].getData().toString("utf8"), entryName: entries[0].entryName }
    : { xml: emptyXml, entryName: "ComicInfo.xml" };
}

export async function writeComicInfoArchive(data: Buffer, xml: string): Promise<Buffer> {
  const { entryName } = await readComicInfoArchive(data);
  if (!isRar(data)) {
    const zip = new AdmZip(data);
    if (zip.getEntry(entryName)) zip.updateFile(entryName, Buffer.from(xml, "utf8"));
    else zip.addFile(entryName, Buffer.from(xml, "utf8"));
    return zip.toBuffer();
  }

  return writeRarComicInfo(data, xml, entryName);
}

async function writeRarComicInfo(data: Buffer, xml: string, entryName: string): Promise<Buffer> {
  const { RarWriter } = await import("@bitplane/rars");
  const extractor = await openRar(data);
  const extracted = extractor.extract({});
  const files = [...extracted.files];
  const flags = extracted.arcHeader.flags;
  if (flags.volume || flags.headerEncrypted || flags.lock || flags.authInfo || files.some((file) => file.fileHeader.flags.encrypted)) {
    throw new Error("unsupportedArchive");
  }
  const writer = new RarWriter({
    format: data[6] === 0 ? "rar29" : "rar50",
    level: files.some((file) => file.fileHeader.method !== "Storing") ? 3 : 0,
    solid: flags.solid,
    comment: extracted.arcHeader.comment || undefined,
  });
  const members: Array<{ directory: boolean; modifiedAt?: Date }> = [];
  try {
    let found = false;
    for (const file of files) {
      const header = file.fileHeader;
      const isMetadata = header.name === entryName;
      found ||= isMetadata;
      const modifiedAt = new Date(data[6] === 0 ? `${header.time}Z` : header.time);
      members.push({ directory: header.flags.directory, modifiedAt: Number.isNaN(modifiedAt.valueOf()) ? undefined : modifiedAt });
      writer.add(header.name, isMetadata ? xml : file.extraction ?? new Uint8Array(), {
        modifiedAt: Number.isNaN(modifiedAt.valueOf()) ? undefined : modifiedAt,
        mode: header.flags.directory ? 0o40755 : undefined,
      });
    }
    if (!found) {
      writer.add(entryName, xml);
      members.push({ directory: false });
    }
    const updated = restoreRarHeaders(Buffer.from(await writer.bytes({ signal: AbortSignal.timeout(300_000) })), members);
    const verification = await openRar(updated);
    const saved = [...verification.extract({}).files];
    if (saved.length !== files.length + (found ? 0 : 1)) throw new Error("saveError");
    for (const [index, file] of files.entries()) {
      const persisted = saved[index];
      if (persisted.fileHeader.name !== file.fileHeader.name || persisted.fileHeader.flags.directory !== file.fileHeader.flags.directory) throw new Error("saveError");
      const expected = file.fileHeader.name === entryName ? Buffer.from(xml, "utf8") : Buffer.from(file.extraction ?? []);
      if (!expected.equals(Buffer.from(persisted.extraction ?? []))) throw new Error("saveError");
    }
    if ((await readComicInfoArchive(updated)).xml !== xml) throw new Error("saveError");
    return updated;
  } finally {
    writer.close();
  }
}
