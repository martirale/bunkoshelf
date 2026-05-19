export function buildNaturalSortKey(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.replace(/\d+/g, (num) => num.padStart(5, "0")).toLowerCase();
}
