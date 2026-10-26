export function aggregateSeriesRelations(volumes: Array<{ genres: string[]; tags: string[] }>) {
  function collect(field: "genres" | "tags") {
    const names = new Map<string, { name: string }>();
    for (const volume of volumes) {
      for (const value of volume[field]) {
        const name = value.trim();
        const key = name.toLowerCase();
        if (name && !names.has(key)) names.set(key, { name });
      }
    }
    return [...names.values()];
  }
  return { genres: collect("genres"), tags: collect("tags") };
}
