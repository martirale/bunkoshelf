import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile, rm, mkdir, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { Readable } from "node:stream";
import { RarWriter } from "@bitplane/rars";
import { createExtractorFromData } from "node-unrar-js";
import { loadUnrarWasmBinary } from "../src/lib/unrar.ts";
import AdmZip from "adm-zip";
import { parseComicInfoDocument } from "../src/lib/comicInfoDocument.ts";
import { readComicInfoArchive, writeComicInfoArchive } from "../src/lib/comicInfoArchive.ts";
import { readStoredComicArchive, writeStoredComicArchive, verifyStoredComicArchive } from "../src/lib/comicInfoStorage.ts";
import { getComicTitle, getComicSeriesTitle, getComicOriginalTitle } from "../src/lib/comicTitles.ts";
import r2Client from "../src/lib/r2.ts";
import {
  AbortMultipartUploadCommand, CompleteMultipartUploadCommand, CreateMultipartUploadCommand,
  GetObjectCommand, HeadObjectCommand, PutObjectCommand, UploadPartCommand,
} from "@aws-sdk/client-s3";

const xml = `<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
  <Title>Original &amp; title</Title>
  <Series>Original series</Series>
  <AltTitle>  Título alternativo  </AltTitle>
  <AltSeries>Serie alternativa</AltSeries>
  <Number>1.5</Number>
  <Writer>Author</Writer>
  <Genre>Adventure; Drama</Genre>
  <Tags>Tag one, Tag two</Tags>
  <Pages><Page Image="0" Type="FrontCover" /></Pages>
  <Custom><Nested>Keep this</Nested></Custom>
</ComicInfo>`;

test("parses alternate titles, standard metadata and taxonomy without losing the originals", async () => {
  const document = await parseComicInfoDocument(xml);
  assert.equal(document.metadata.title, "Original & title");
  assert.equal(document.metadata.series, "Original series");
  assert.equal(document.metadata.altTitle, "Título alternativo");
  assert.equal(document.metadata.altSeries, "Serie alternativa");
  assert.equal(document.metadata.number, 1.5);
  assert.deepEqual(document.genres, ["Adventure", "Drama"]);
  assert.deepEqual(document.tags, ["Tag one", "Tag two"]);
  assert.equal(getComicTitle(document.metadata), "Título alternativo");
  assert.equal(getComicSeriesTitle(document.metadata), "Serie alternativa");
  assert.equal(getComicOriginalTitle(document.metadata), "Original & title");
  assert.equal(getComicOriginalTitle(document.metadata, true), "Original series");
});

test("missing or empty alternate titles keep the existing title and hide the original field", async () => {
  for (const alternate of ["", "<AltTitle>  </AltTitle><AltSeries />"]) {
    const { metadata } = await parseComicInfoDocument(`<ComicInfo><Title>Original</Title><Series>Series</Series>${alternate}</ComicInfo>`);
    assert.equal(getComicTitle(metadata), "Original");
    assert.equal(getComicSeriesTitle(metadata), "Series");
    assert.equal(getComicOriginalTitle(metadata), null);
    assert.equal(getComicOriginalTitle(metadata, true), null);
  }
  assert.equal(getComicTitle(null), null);
  assert.equal(getComicSeriesTitle(undefined), null);
});

test("rejects malformed XML, duplicate fields, invalid numbers and document type declarations", async () => {
  for (const invalid of [
    "", "<ComicInfo>", "<Other />", "<ComicInfo><Title>A</Title></Other>",
    "<ComicInfo><AltTitle>A</AltTitle><AltTitle>B</AltTitle></ComicInfo>",
    "<ComicInfo><Title><Nested>Title</Nested></Title></ComicInfo>",
    "<ComicInfo><Number>wrong</Number></ComicInfo>",
    '<!DOCTYPE ComicInfo [<!ENTITY title "Title">]><ComicInfo><Title>&title;</Title></ComicInfo>',
    `<ComicInfo><Summary>${"x".repeat(2 * 1024 * 1024)}</Summary></ComicInfo>`,
  ]) await assert.rejects(parseComicInfoDocument(invalid), /invalidXml/);
});

test("accepts empty documents and XML namespaces", async () => {
  assert.equal((await parseComicInfoDocument("<ComicInfo />")).metadata.altTitle, null);
  const { metadata } = await parseComicInfoDocument('<ci:ComicInfo xmlns:ci="urn:comic"><ci:Title>Original</ci:Title><ci:AltTitle>Alternate</ci:AltTitle></ci:ComicInfo>');
  assert.equal(getComicTitle(metadata), "Alternate");
});

test("updates only ComicInfo.xml and preserves other ZIP contents, its path and comments", async () => {
  const archive = new AdmZip();
  archive.addFile("nested/COMICINFO.XML", Buffer.from(xml));
  archive.addFile("chapter/content.txt", Buffer.from([0, 1, 2, 255]));
  archive.addZipComment("Archive comment");
  archive.addZipEntryComment("chapter/content.txt", "Entry comment");
  const before = archive.toBuffer();
  const changed = xml.replace("Título alternativo", "Otro título");
  const after = await writeComicInfoArchive(before, changed);
  const updated = new AdmZip(after);
  assert.deepEqual(updated.readFile("chapter/content.txt"), archive.readFile("chapter/content.txt"));
  assert.equal(updated.getZipComment(), "Archive comment");
  assert.equal(updated.getZipEntryComment("chapter/content.txt"), "Entry comment");
  assert.deepEqual(updated.getEntries().map((entry) => entry.entryName), archive.getEntries().map((entry) => entry.entryName));
  assert.equal((await readComicInfoArchive(after)).xml, changed);
  assert.equal((await readComicInfoArchive(before)).xml, xml);
});

for (const [layout, fixture] of Object.entries({
  signed: "UEsDBBQACAAIADe8b10AAAAAAAAAAAAAAAANAAAAQ29taWNJbmZvLnhtbLNxzs/NTPbMS8u3swnJLMlJtfMvykzPzEvMsdGH8G30EUoAUEsHCJqzgxwjAAAALgAAAFBLAwQUAAgACAA3vG9dAAAAAAAAAAAAAAAAEwAAAGNoYXB0ZXIvY29udGVudC50eHQLzUvOSMxLT01RSM7PK0nNKwEAUEsHCHqJJUUTAAAAEQAAAFBLAQIUAxQACAAIADe8b12as4McIwAAAC4AAAANAAAAAAAAAAAAAACAAQAAAABDb21pY0luZm8ueG1sUEsBAhQDFAAIAAgAN7xvXXqJJUUTAAAAEQAAABMAAAAAAAAAAAAAAIABXgAAAGNoYXB0ZXIvY29udGVudC50eHRQSwUGAAAAAAIAAgB8AAAAsgAAAAAA",
  unsigned: "UEsDBBQACAAIANa7b10AAAAAAAAAAAAAAAANAAAAQ29taWNJbmZvLnhtbLNxzs/NTPbMS8u3swnJLMlJtfMvykzPzEvMsdGH8G30EUoAmrODHCMAAAAuAAAAUEsDBBQACAAIANa7b10AAAAAAAAAAAAAAAATAAAAY2hhcHRlci9jb250ZW50LnR4dAvNS85IzEtPTVFIzs8rSc0rAQB6iSVFEwAAABEAAABQSwECFAMUAAgACADWu29dmrODHCMAAAAuAAAADQAAAAAAAAAAAAAAgAEAAAAAQ29taWNJbmZvLnhtbFBLAQIUAxQACAAIANa7b116iSVFEwAAABEAAAATAAAAAAAAAAAAAACAAVoAAABjaGFwdGVyL2NvbnRlbnQudHh0UEsFBgAAAAACAAIAfAAAAKoAAAAAAA==",
})) {
  test(`edits streamed ZIP entries with ${layout} data descriptors without damaging other members`, async () => {
    const data = Buffer.from(fixture, "base64");
    const original = Buffer.from(data);
    const before = new AdmZip(data);
    assert.equal(before.getEntries()[0].header.flags & 8, 8);
    assert.equal((await readComicInfoArchive(data)).xml, "<ComicInfo><Title>Original</Title></ComicInfo>");
    const compressed = before.getEntry("chapter/content.txt")!.getCompressedData();
    const updated = await writeComicInfoArchive(data, xml);
    const after = new AdmZip(updated);
    assert.equal((await readComicInfoArchive(updated)).xml, xml);
    assert.equal(after.readAsText("chapter/content.txt"), "Unchanged content");
    assert.deepEqual(after.getEntry("chapter/content.txt")!.getCompressedData(), compressed);
    assert.deepEqual(after.getEntries().map((entry) => entry.entryName), before.getEntries().map((entry) => entry.entryName));
    assert.ok(after.getEntries().every((entry) => (entry.header.flags & 8) === 0));
    assert.deepEqual(data, original);
    const repeated = await writeComicInfoArchive(updated, "<ComicInfo><Title>Another title</Title></ComicInfo>");
    assert.equal(new AdmZip(repeated).readAsText("chapter/content.txt"), "Unchanged content");
  });
}

test("creates ComicInfo.xml when absent and clears alternatives when removed", async () => {
  const archive = new AdmZip();
  archive.addFile("content.txt", Buffer.from("Unchanged"));
  const before = archive.toBuffer();
  assert.match((await readComicInfoArchive(before)).xml, /<ComicInfo>/);
  const updated = await writeComicInfoArchive(before, "<ComicInfo><Title>Original</Title></ComicInfo>");
  const document = await parseComicInfoDocument((await readComicInfoArchive(updated)).xml);
  assert.equal(document.metadata.altTitle, null);
  assert.equal(document.metadata.altSeries, null);
  assert.equal(new AdmZip(updated).readAsText("content.txt"), "Unchanged");
});

test("rejects ambiguous archives with duplicate ComicInfo.xml entries", async () => {
  const archive = new AdmZip();
  archive.addFile("ComicInfo.xml", Buffer.from(xml));
  archive.addFile("nested/ComicInfo.xml", Buffer.from(xml));
  await assert.rejects(writeComicInfoArchive(archive.toBuffer(), xml), /duplicateXml/);
});

test("writes a local archive atomically and refuses stale edits", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "bunko-comicinfo-test-"));
  try {
    const filePath = path.join(directory, "volume.cbz");
    const zip = new AdmZip();
    zip.addFile("ComicInfo.xml", Buffer.from(xml));
    await writeFile(filePath, zip.toBuffer());
    const original = await readStoredComicArchive(filePath, "local");
    const data = await writeComicInfoArchive(original.data, xml.replace("Título alternativo", "New title"));
    const saved = await writeStoredComicArchive(filePath, "local", original, data);
    assert.notEqual(saved.revision, original.revision);
    assert.deepEqual(await readFile(filePath), data);
    await verifyStoredComicArchive(filePath, "local", saved);
    await assert.rejects(writeStoredComicArchive(filePath, "local", original, original.data), /conflict/);
    assert.deepEqual(await readFile(filePath), data);
    await writeStoredComicArchive(filePath, "local", saved, original.data);
    assert.deepEqual(await readFile(filePath), original.data);
    await assert.rejects(verifyStoredComicArchive(filePath, "local", saved), /conflict/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("updates cloud archives conditionally and preserves their object metadata", async (context) => {
  let data = Buffer.from("Original archive");
  let etag = '"original-etag"';
  const calls: PutObjectCommand[] = [];
  const requests: unknown[] = [];
  context.mock.method(r2Client, "send", async (command: GetObjectCommand | PutObjectCommand | HeadObjectCommand) => {
    requests.push(command);
    if (command instanceof GetObjectCommand) {
      if (command.input.IfMatch && command.input.IfMatch !== etag) throw Object.assign(new Error("Stale"), { name: "PreconditionFailed" });
      return { Body: Readable.from([data]), ContentLength: data.length, ETag: etag, ContentType: "application/zip", CacheControl: "private", ContentDisposition: "attachment", Metadata: { source: "library" } };
    }
    if (command.input.IfMatch && command.input.IfMatch !== etag) throw Object.assign(new Error("The object has changed"), { name: "PreconditionFailed", $metadata: { httpStatusCode: 412 } });
    if (command instanceof HeadObjectCommand) return { ETag: etag, ContentLength: data.length };
    calls.push(command);
    data = Buffer.from(command.input.Body as Buffer);
    etag = '"updated-etag"';
    return { ETag: etag };
  });
  const original = await readStoredComicArchive("/library/manga/volume.cbz", "cloud");
  assert.deepEqual(original.data, data);
  const saved = await writeStoredComicArchive("/library/manga/volume.cbz", "cloud", original, Buffer.from("Updated archive"));
  await verifyStoredComicArchive("/library/manga/volume.cbz", "cloud", saved);
  assert.equal(requests.filter((command) => command instanceof GetObjectCommand).length, 1);
  assert.equal(requests.filter((command) => command instanceof HeadObjectCommand).length, 1);
  await assert.rejects(verifyStoredComicArchive("/library/manga/volume.cbz", "cloud", original), { name: "PreconditionFailed" });
  assert.equal(saved.etag, '"updated-etag"');
  assert.equal(calls[0].input.Key, "library/manga/volume.cbz");
  assert.equal(calls[0].input.ContentType, "application/zip");
  assert.equal(calls[0].input.CacheControl, "private");
  assert.equal(calls[0].input.ContentDisposition, "attachment");
  assert.equal(calls[0].input.Metadata?.source, "library");
  await assert.rejects(readStoredComicArchive("/library/manga/volume.cbz", "cloud", original.revision), { name: "PreconditionFailed" });
  await assert.rejects(writeStoredComicArchive("/library/manga/volume.cbz", "cloud", original, original.data), { name: "PreconditionFailed" });
  assert.equal(data.toString(), "Updated archive");
  await writeStoredComicArchive("/library/manga/volume.cbz", "cloud", saved, original.data);
  assert.deepEqual(data, original.data);
  await assert.rejects(writeStoredComicArchive("/library/manga/volume.cbz", "cloud", { ...saved, etag: undefined }, original.data), /conflict/);
});

for (const scenario of ["success", "lost completion response", "failed part"] as const) {
  test(`saves large R2 archives with multipart uploads: ${scenario}`, async (context) => {
    const partSize = 32 * 1024 * 1024;
    const data = Buffer.allocUnsafe(4 * partSize + 3);
    const previous = { data: Buffer.from("original"), revision: 'etag:"original"', etag: '"original"', metadata: { source: "library" } };
    const failure = Object.assign(new Error("Transfer timeout"), { name: "AbortError" });
    const uploaded: number[] = [];
    let metadata: Record<string, string> | undefined;
    let aborted = false;
    context.mock.method(r2Client, "send", async (command: object, options: { abortSignal: AbortSignal }) => {
      assert.equal(options.abortSignal.aborted, false);
      if (command instanceof CreateMultipartUploadCommand) {
        metadata = command.input.Metadata;
        assert.equal(metadata?.source, "library");
        return { UploadId: "upload" };
      }
      if (command instanceof UploadPartCommand) {
        const number = uploaded.length + 1;
        assert.equal(command.input.PartNumber, number);
        assert.equal(command.input.UploadId, "upload");
        assert.equal((command.input.Body as Buffer).buffer, data.buffer);
        uploaded.push((command.input.Body as Buffer).length);
        if (scenario === "failed part" && number === 2) throw failure;
        return { ETag: `"part-${number}"` };
      }
      if (command instanceof CompleteMultipartUploadCommand) {
        assert.equal(command.input.IfMatch, previous.etag);
        assert.deepEqual(command.input.MultipartUpload?.Parts, uploaded.map((_, index) => ({ PartNumber: index + 1, ETag: `"part-${index + 1}"` })));
        if (scenario === "lost completion response") throw failure;
        return { ETag: '"saved"' };
      }
      if (command instanceof HeadObjectCommand && scenario === "lost completion response") {
        assert.equal(aborted, true);
        return { ETag: '"saved"', Metadata: metadata, ContentLength: data.length };
      }
      if (command instanceof AbortMultipartUploadCommand && scenario !== "success") {
        aborted = true;
        return {};
      }
      assert.fail(`Unexpected command: ${command.constructor.name}`);
    });

    const write = writeStoredComicArchive("volume.cbz", "cloud", previous, data);
    if (scenario === "failed part") {
      await assert.rejects(write, failure);
      assert.equal(aborted, true);
      assert.deepEqual(uploaded, [partSize, partSize]);
    } else {
      assert.equal((await write).etag, '"saved"');
      assert.deepEqual(uploaded, [partSize, partSize, partSize, partSize, 3]);
    }
  });
}

async function extractRar(data: Buffer) {
  const wasm = await loadUnrarWasmBinary();
  const extractor = await createExtractorFromData({ data: Uint8Array.from(data).buffer, wasmBinary: Uint8Array.from(wasm).buffer });
  const extracted = extractor.extract({});
  return { files: [...extracted.files], comment: extracted.arcHeader.comment };
}

for (const format of ["rar29", "rar50"] as const) {
  for (const solid of [false, true]) {
    test(`updates ${format} ${solid ? "solid" : "non-solid"} archives using bundled WebAssembly`, async () => {
      const writer = new RarWriter({ format, level: 3, solid, comment: "Archive comment" });
      try {
        writer.add("notes/ComicInfo.xml", xml, { modifiedAt: new Date("2020-01-02T03:04:06Z") });
        writer.add("capítulo/内容.txt", "Original content ".repeat(100));
        writer.add("extra.txt", "Another file");
        const data = Buffer.from(await writer.bytes());
        const before = await extractRar(data);
        assert.equal(before.files.slice(1).some((file) => file.fileHeader.flags.solid), solid);
        const changed = xml.replace("Título alternativo", "New title");
        const updated = await writeComicInfoArchive(data, changed);
        const after = await extractRar(updated);
        assert.equal(updated[6], data[6]);
        assert.equal((await readComicInfoArchive(updated)).xml, changed);
        assert.equal(after.comment, before.comment);
        assert.deepEqual(after.files.map((file) => file.fileHeader.name), before.files.map((file) => file.fileHeader.name));
        assert.equal(after.files[0].fileHeader.time, before.files[0].fileHeader.time);
        for (let index = 1; index < before.files.length; index++) {
          assert.deepEqual(after.files[index].extraction, before.files[index].extraction);
        }
        const restored = await writeComicInfoArchive(updated, xml);
        assert.equal((await readComicInfoArchive(restored)).xml, xml);
      } finally {
        writer.close();
      }
    });
  }
}

test("creates missing XML in a RAR archive without external commands", async () => {
  const writer = new RarWriter({ format: "rar50", level: 0 });
  try {
    writer.add("content.txt", "Unchanged");
    const updated = await writeComicInfoArchive(Buffer.from(await writer.bytes()), xml);
    const { files } = await extractRar(updated);
    assert.equal(Buffer.from(files[0].extraction!).toString(), "Unchanged");
    assert.equal((await readComicInfoArchive(updated)).xml, xml);
  } finally {
    writer.close();
  }
});

for (const [format, fixture] of Object.entries({
  rar4: "UmFyIRoHAM+QcwAADQAAAAAAAADlunTggCUAAAAAAAAAAAAAAAAAAAAAIQAUMAUAEAAAAGVtcHR5+7d04IAnAAAAAAAAAAAAAAAAAAAAACEAFDAHABAAAABjaGFwdGVyDKx0AIAzAAkAAAAJAAAAAJpAMiUAACEAFDATACAAAABjaGFwdGVyL2NvbnRlbnQudHh0VW5jaGFuZ2VkcPN0AIAtAC4AAAAuAAAAAJqzgxwAACEAFDANACAAAABDb21pY0luZm8ueG1sPENvbWljSW5mbz48VGl0bGU+T3JpZ2luYWw8L1RpdGxlPjwvQ29taWNJbmZvPgSwewAABwA=",
  rar5: "UmFyIRoHAQDFGjMyAwEAAEj2fgsRAgAFABAAAAAAAAAFZW1wdHkZa+rqEwIABQAQAAAAAAAAB2NoYXB0ZXJAQA5vIAICCQQJIJpAMiUAABNjaGFwdGVyL2NvbnRlbnQudHh0VW5jaGFuZ2VkJRALGBoCAi4ELiCas4McAAANQ29taWNJbmZvLnhtbDxDb21pY0luZm8+PFRpdGxlPk9yaWdpbmFsPC9UaXRsZT48L0NvbWljSW5mbz4Zsjo1AwUAAA==",
})) {
  test(`preserves empty directories and member order in ${format}`, async () => {
    const original = Buffer.from(fixture, "base64");
    const before = await extractRar(original);
    assert.equal(before.files[0].fileHeader.flags.directory, true);
    assert.equal(before.files[1].fileHeader.flags.directory, true);
    const updated = await writeComicInfoArchive(original, xml);
    const after = await extractRar(updated);
    assert.deepEqual(after.files.map((file) => ({ name: file.fileHeader.name, directory: file.fileHeader.flags.directory })),
      before.files.map((file) => ({ name: file.fileHeader.name, directory: file.fileHeader.flags.directory })));
    assert.equal(Buffer.from(after.files[2].extraction!).toString(), "Unchanged");
    assert.equal((await readComicInfoArchive(updated)).xml, xml);
  });
}

test("loads the distributed RAR writer with only its packaged worker and WASM assets", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "bunko-rar-package-test-"));
  try {
    const require = createRequire(import.meta.url);
    const source = path.dirname(require.resolve("@bitplane/rars/package.json"));
    const target = path.join(directory, "node_modules/@bitplane/rars");
    await mkdir(target, { recursive: true });
    await cp(path.join(source, "node"), path.join(target, "node"), { recursive: true });
    await cp(path.join(source, "package.json"), path.join(target, "package.json"));
    const script = `const { RarWriter, RarArchive } = require("@bitplane/rars");
      (async () => {
        const writer = new RarWriter({ format: "rar50", level: 0 });
        writer.add("ComicInfo.xml", "<ComicInfo />");
        const archive = await RarArchive.open(await writer.bytes());
        const text = new TextDecoder().decode(await archive.get("ComicInfo.xml").bytes());
        archive.close(); writer.close();
        if (text !== "<ComicInfo />") process.exitCode = 1;
      })().catch(error => { console.error(error); process.exitCode = 1; });`;
    await promisify(execFile)(process.execPath, ["-e", script], { cwd: directory, env: { ...process.env, PATH: "", RAR_BINARY: "" } });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
