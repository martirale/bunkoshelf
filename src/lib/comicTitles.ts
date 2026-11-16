interface ComicTitles {
  title?: unknown;
  series?: unknown;
  altTitle?: unknown;
  altSeries?: unknown;
}

export function getComicTitle(meta: ComicTitles | null | undefined): string | null {
  const alternate = typeof meta?.altTitle === "string" ? meta.altTitle.trim() : "";
  return alternate || (typeof meta?.title === "string" ? meta.title : null);
}

export function getComicSeriesTitle(meta: ComicTitles | null | undefined): string | null {
  const alternate = typeof meta?.altSeries === "string" ? meta.altSeries.trim() : "";
  return alternate || (typeof meta?.series === "string" ? meta.series : null);
}

export function getComicOriginalTitle(meta: ComicTitles, series = false): string | null {
  const alternate = series ? meta.altSeries : meta.altTitle;
  const original = series ? meta.series : meta.title;
  return typeof alternate === "string" && alternate.trim() && typeof original === "string" ? original : null;
}
