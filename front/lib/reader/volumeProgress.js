export function volumeProgress(volumeId) {
  if (typeof window === "undefined") return null;

  try {
    const key = `reader-progress:${volumeId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
