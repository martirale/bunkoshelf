export async function volumeProgress(slug) {
  try {
    const res = await fetch("/api/reader/progress/get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slug }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching progress from DB:", err);
    return null;
  }
}
