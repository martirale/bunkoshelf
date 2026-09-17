const INVALID_XML_ENTITY = /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/gi;

export function normalizeComicInfoXml(xml: string): string {
  const withoutBom = xml.replace(/^\uFEFF/, "");

  return withoutBom.replace(INVALID_XML_ENTITY, "&amp;");
}
