import { getReadingProgress } from "@/actions/reader";

export async function volumeProgress(slug) {
  try {
    const data = await getReadingProgress({ slug });

    if (data.error) return null;

    return data;
  } catch (err) {
    console.error("Error fetching progress from DB:", err);
    return null;
  }
}
