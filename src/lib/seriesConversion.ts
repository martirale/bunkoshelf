export function getConvertedSeriesPath(source: string, oneshot: boolean): string | null {
  const separator = source.lastIndexOf("/");
  const name = source.slice(separator + 1);
  const base = name.replace(/\s*\[oneshot\]\s*$/i, "").trimEnd();
  if (!base.trim() || /\[oneshot\]/i.test(base)) return null;
  const target = `${source.slice(0, separator + 1)}${base}${oneshot ? " [oneshot]" : ""}`;
  return target;
}
