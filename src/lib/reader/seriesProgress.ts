import { getSeriesProgress } from "@/actions/reader";

export async function seriesProgress(seriesSlug: string) {
  try {
    const data = await getSeriesProgress({ seriesSlug });

    if (!data || "error" in data) return null;

    return data;
  } catch (err) {
    console.error("Error fetching series progress from DB:", err);
    return null;
  }
}
