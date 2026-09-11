export function getBookCoverUrl(slug: string, coverPath: string | null): string | null {
  return coverPath ? `/api/library/books/cover/${encodeURIComponent(slug)}` : null;
}
