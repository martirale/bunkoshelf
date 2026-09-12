const namedEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

export const BOOK_AGE_RATINGS = ["0+", "6+", "10+", "13+", "15+", "16+", "17+", "18+"] as const;

export type BookAgeRating = typeof BOOK_AGE_RATINGS[number];

const bookAgeRatingMinimum: Record<BookAgeRating, number> = {
  "0+": 0,
  "6+": 6,
  "10+": 10,
  "13+": 13,
  "15+": 15,
  "16+": 16,
  "17+": 17,
  "18+": 18,
};

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, token: string) => {
    const key = token.toLowerCase();
    if (key.startsWith("#x")) return String.fromCodePoint(Number.parseInt(key.slice(2), 16));
    if (key.startsWith("#")) return String.fromCodePoint(Number.parseInt(key.slice(1), 10));
    return namedEntities[key] ?? entity;
  });
}

export function toPlainBookText(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = decodeHtmlEntities(value)
    .replace(/<(?:br|\/p|\/div|\/li|\/h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[\t ]{2,}/g, " ")
    .trim();
  return text || null;
}

export function getBookPublicationYear(value: string | null | undefined): string | null {
  const year = value?.match(/\b(\d{4})\b/)?.[1];
  return year ?? null;
}

export function normalizeBookAgeRating(value: string | null | undefined): BookAgeRating | null {
  if (!value) return null;
  const rating = value.trim() as BookAgeRating;
  return BOOK_AGE_RATINGS.includes(rating) ? rating : null;
}

export function getBookAgeMinimum(value: string | null | undefined): number | null {
  const rating = normalizeBookAgeRating(value);
  return rating ? bookAgeRatingMinimum[rating] : null;
}

export function getBookIdentifierScheme(value: string, scheme: string | null): string {
  if (scheme?.toLowerCase() === "isbn") return "ISBN";
  if (scheme) return scheme;
  if (/^mobi-asin:/i.test(value)) return "ASIN";
  if (/^(?:urn:)?isbn:/i.test(value)) return "ISBN";
  if (/^(?:urn:)?uuid:/i.test(value)) return "UUID";
  if (/^(?:97[89])?[\d -]{9,}$/i.test(value)) return "ISBN";
  return "ID";
}

export function getBookIdentifierValue(value: string, scheme: string | null): string {
  const normalizedScheme = getBookIdentifierScheme(value, scheme).toLowerCase();
  if (normalizedScheme === "asin") return value.replace(/^mobi-asin:/i, "");
  if (normalizedScheme === "isbn") return value.replace(/^(?:urn:)?isbn:/i, "");
  if (normalizedScheme === "uuid") return value.replace(/^(?:urn:)?uuid:/i, "");
  return value;
}
