"use server";

import { revalidatePath, updateTag } from "next/cache";
import { verifySession } from "@/lib/auth/verifySession";
import { createLogicalSeriesRecord } from "@/lib/db/logicalSeries";
import { MANGA_LIBRARY_TAG } from "@/lib/mangaLibraryCache";
import { validateLogicalSeries, type LogicalSeriesInput } from "@/lib/logicalSeries";

export async function createLogicalSeries(input: LogicalSeriesInput) {
  const user = await verifySession();
  if (!user?.isAdmin) return { ok: false, error: "unauthorized" } as const;
  if (!validateLogicalSeries(input)) return { ok: false, error: "invalid" } as const;
  try {
    await createLogicalSeriesRecord(input);
    updateTag(MANGA_LIBRARY_TAG);
    revalidatePath("/[lang]", "layout");
    return { ok: true } as const;
  } catch (error) {
    console.error("Error creating logical series:", error);
    return { ok: false, error: "unavailable" } as const;
  }
}
