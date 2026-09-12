import assert from "node:assert/strict";
import test from "node:test";
import AdmZip from "adm-zip";
import { parseEpubBuffer } from "../src/lib/books/epubParser.ts";
import { normalizeBookAgeRating } from "../src/lib/books/metadata.ts";

function createEpub(options: { encrypted?: boolean; fixedLayout?: boolean; includeCover?: boolean; obfuscatedFont?: boolean; repeatedIdentifier?: boolean; htmlDescription?: boolean; ageRating?: string } = {}) {
  const zip = new AdmZip();
  zip.addFile("mimetype", Buffer.from("application/epub+zip"));
  zip.addFile("META-INF/container.xml", Buffer.from(`<?xml version="1.0"?><container><rootfiles><rootfile full-path="OPS/book.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`));
  if (options.encrypted) zip.addFile("META-INF/encryption.xml", Buffer.from("<encryption><EncryptedData><EncryptionMethod Algorithm=\"http://www.w3.org/2001/04/xmlenc#aes256-cbc\"/><CipherData><CipherReference URI=\"chapter.xhtml\"/></CipherData></EncryptedData></encryption>"));
  if (options.obfuscatedFont) {
    zip.addFile("META-INF/encryption.xml", Buffer.from("<encryption><EncryptedData><EncryptionMethod Algorithm=\"http://www.idpf.org/2008/embedding\"/><CipherData><CipherReference URI=\"fonts/book.woff2\"/></CipherData></EncryptedData></encryption>"));
    zip.addFile("OPS/fonts/book.woff2", Buffer.from([0, 1, 2]));
  }
  const description = options.htmlDescription ? "<![CDATA[<div><p>Primera línea.</p><p>Segunda línea.</p></div>]]>" : "Descripción";
  const ageRating = options.ageRating ? `<meta property="schema:typicalAgeRange">${options.ageRating}</meta>` : "";
  zip.addFile("OPS/book.opf", Buffer.from(`<?xml version="1.0"?><package><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="isbn" opf:scheme="ISBN" xmlns:opf="http://www.idpf.org/2007/opf">9780000000001</dc:identifier>${options.repeatedIdentifier ? '<dc:identifier>9780000000001</dc:identifier>' : ""}<dc:title>Libro de prueba</dc:title><dc:language>es</dc:language><dc:creator id="author">Autora</dc:creator><dc:subject>Ficción</dc:subject><dc:description>${description}</dc:description>${ageRating}<meta property="rendition:layout">${options.fixedLayout ? "pre-paginated" : "reflowable"}</meta></metadata><manifest><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${options.includeCover ? '<item id="cover" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/>' : ""}</manifest><spine><itemref idref="chapter"/></spine></package>`));
  zip.addFile("OPS/chapter.xhtml", Buffer.from("<html><body>Contenido</body></html>"));
  zip.addFile("OPS/nav.xhtml", Buffer.from("<html><body>Índice</body></html>"));
  if (options.includeCover) zip.addFile("OPS/cover.jpg", Buffer.from([0xff, 0xd8, 0xff]));
  return zip.toBuffer();
}

test("parsea metadatos, portada y rendition de un EPUB", async () => {
  const result = await parseEpubBuffer(createEpub({ fixedLayout: true, includeCover: true }));
  assert.equal(result.metadata.title, "Libro de prueba");
  assert.equal(result.metadata.renditionLayout, "pre-paginated");
  assert.equal(result.metadata.identifiers[0]?.value, "9780000000001");
  assert.equal(result.metadata.people[0]?.name, "Autora");
  assert.equal(result.metadata.coverPath, "OPS/cover.jpg");
  assert.ok(result.cover?.data.length);
});

test("acepta manifiestos encryption.xml durante la indexación", async () => {
  const result = await parseEpubBuffer(createEpub({ encrypted: true }));
  assert.equal(result.metadata.title, "Libro de prueba");
});

test("acepta ofuscación de fuentes EPUB", async () => {
  const result = await parseEpubBuffer(createEpub({ obfuscatedFont: true }));
  assert.equal(result.metadata.title, "Libro de prueba");
});

test("deduplica identificadores repetidos", async () => {
  const result = await parseEpubBuffer(createEpub({ repeatedIdentifier: true }));
  assert.equal(result.metadata.identifiers.length, 1);
});

test("normaliza descripciones HTML y clasificación de edad", async () => {
  const result = await parseEpubBuffer(createEpub({ htmlDescription: true, ageRating: "16+" }));
  assert.equal(result.metadata.description, "Primera línea.\nSegunda línea.");
  assert.equal(result.metadata.ageRating, "16+");
});

test("normaliza las clasificaciones de libros a la escala de Bunko", () => {
  assert.equal(normalizeBookAgeRating("18+"), "18+");
  assert.equal(normalizeBookAgeRating("13+"), "13+");
  assert.equal(normalizeBookAgeRating("14+"), null);
  assert.equal(normalizeBookAgeRating("M"), null);
});

test("rechaza EPUB sin documento de paquete", async () => {
  const zip = new AdmZip();
  zip.addFile("mimetype", Buffer.from("application/epub+zip"));
  await assert.rejects(() => parseEpubBuffer(zip.toBuffer()), /container.xml/);
});
