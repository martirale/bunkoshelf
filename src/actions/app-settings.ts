"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { hasPermission } from "@/lib/auth/roles";
import { verifySession } from "@/lib/auth/verifySession";
import {
  APP_SETTINGS_TAG,
  updateOthersLibraryEnabled,
} from "@/lib/db/appSettings";

const SUPPORTED_LOCALES = ["es", "en"] as const;

function revalidateLibraryModePaths() {
  for (const lang of SUPPORTED_LOCALES) {
    revalidatePath(`/${lang}`, "layout");
    revalidatePath(`/${lang}/manga`, "layout");
    revalidatePath(`/${lang}/favorites`, "layout");
    revalidatePath(`/${lang}/settings/library`);
    revalidatePath(`/${lang}/others`);
    revalidatePath(`/${lang}/others/series`);
    revalidatePath(`/${lang}/others/volumes`);
    revalidatePath(`/${lang}/others/toread`);
    revalidatePath(`/${lang}/favorites/others`);
  }
}

export async function setOthersLibraryMode(enabled: boolean) {
  let error: Error | null = null;

  try {
    const user = await verifySession();

    if (!hasPermission(user, "settings:access")) {
      return { error: "Unauthorized", status: 401 };
    }

    await updateOthersLibraryEnabled(enabled);
    revalidateTag(APP_SETTINGS_TAG, "max");
    revalidateLibraryModePaths();

    return { success: true, status: 200 };
  } catch (e) {
    error = e as Error;
  } finally {
    if (error) {
      console.error("Error updating app settings:", error);
      return { error: "Server error", status: 500 };
    }
  }
}
