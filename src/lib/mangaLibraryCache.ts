import { revalidateTag } from "next/cache";

export const MANGA_LIBRARY_TAG = "manga-library";

export function revalidateMangaLibraryCache() {
  revalidateTag(MANGA_LIBRARY_TAG, "max");
}
