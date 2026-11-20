"use server";

import { revalidatePath, updateTag } from "next/cache";
import { verifySession } from "@/lib/auth/verifySession";
import { convertSeriesStorage } from "@/lib/db/seriesConversion";
import { MANGA_LIBRARY_TAG } from "@/lib/mangaLibraryCache";
import type { OneshotSection } from "@/lib/librarySection";

const expectedErrors = new Set([
  "busy", "destinationExists", "logicalMember", "pendingCleanup",
  "requiresOneVolume", "sharedDirectory", "staleConversion", "storageChanged", "unsafeStorage",
]);

export async function convertLibrarySeries(input: {
  volumeId: string;
  section: OneshotSection;
  oneshot: boolean;
  expectedPath: string;
}) {
  const user = await verifySession();
  if (!user?.isAdmin) return { ok: false, error: "unauthorized" } as const;
  if (!input || typeof input.volumeId !== "string" || !input.volumeId
    || typeof input.expectedPath !== "string" || typeof input.oneshot !== "boolean"
    || !["manga", "comic", "others", "books"].includes(input.section)) {
    return { ok: false, error: "staleConversion" } as const;
  }
  try {
    const result = await convertSeriesStorage(input);
    updateTag(MANGA_LIBRARY_TAG);
    revalidatePath("/[lang]", "layout");
    return { ok: true, ...result } as const;
  } catch (error) {
    if (error instanceof Error && expectedErrors.has(error.message)) {
      return { ok: false, error: error.message } as const;
    }
    console.error("Library conversion failed:", error);
    return { ok: false, error: "unavailable" } as const;
  }
}
