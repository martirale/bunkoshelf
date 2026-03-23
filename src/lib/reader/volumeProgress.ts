import { getReadingProgress } from "@/actions/reader";

export async function volumeProgress(slug: string) {
  try {
    const data = await getReadingProgress({ slug });

    if (!data || "error" in data) return null;

    return data;
  } catch (err) {
    console.error("Error fetching progress from DB:", err);
    return null;
  }
}
