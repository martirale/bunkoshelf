export function ageRatingMap(ageRating: string | null | undefined): number | null {
  if (!ageRating || typeof ageRating !== "string") return null;

  const mapping: Record<string, number | null> = {
    Unknown: null,
    "Adults Only 18+": 18,
    "Early Childhood": 0,
    Everyone: 0,
    "Everyone 10+": 10,
    G: 0,
    "Kids to Adults": 6,
    M: 16,
    "MA15+": 15,
    "Mature 17+": 17,
    PG: 10,
    "R18+": 18,
    "Rating Pending": null,
    Teen: 13,
    "X18+": 18,
  };

  return mapping[ageRating] ?? null;
}

export function normalizeCommaSeparatedText(
  value: string | string[] | null | undefined
): string | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    const parts = value.map((entry) => String(entry).trim()).filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }

  const parts = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}
