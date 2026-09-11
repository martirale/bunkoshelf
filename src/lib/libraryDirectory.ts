export function sanitizeLibraryDirectoryName(
  value: string | null | undefined
): string {
  return (value || "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} ]+/gu, "-");
}

export function normalizeLibraryDirectoryName(
  value: string | null | undefined
): string {
  return sanitizeLibraryDirectoryName(value)
    .trim()
    .replace(/^-+|-+$/g, "");
}
