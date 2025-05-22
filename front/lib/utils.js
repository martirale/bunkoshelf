import buildInfo from "./buildInfo.json";

// Sorting volumes by title and number
export function sortByPaddedTitle(items, getValue = (item) => item.title) {
  const padNumbers = (str) =>
    str.replace(/\d+/g, (num) => num.padStart(5, "0")).toLowerCase();

  return items.slice().sort((a, b) => {
    const aStr = padNumbers(getValue(a));
    const bStr = padNumbers(getValue(b));
    return aStr.localeCompare(bStr);
  });
}

// Convert age rating to numbers
export function ageRatingMap(ageRating) {
  if (!ageRating || typeof ageRating !== "string") return null;

  const mapping = {
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

// Current version info
export function getBuildInfo() {
  return buildInfo;
}
