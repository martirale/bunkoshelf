export async function seriesProgress(seriesSlug) {
  try {
    const res = await fetch("/api/reader/progress/series", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ seriesSlug }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching series progress from DB:", err);
    return null;
  }
}
