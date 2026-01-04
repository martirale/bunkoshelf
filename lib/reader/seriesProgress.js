import { getSeriesProgress } from "@/actions/reader";

export async function seriesProgress(seriesSlug) {
  try {
    const data = await getSeriesProgress({ seriesSlug });

    if (data.error) return null;

    return data;
  } catch (err) {
    console.error("Error fetching series progress from DB:", err);
    return null;
  }
}
