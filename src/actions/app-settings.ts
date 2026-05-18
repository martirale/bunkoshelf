"use server";

import { revalidateTag } from "next/cache";
import { hasPermission } from "@/lib/auth/roles";
import { verifySession } from "@/lib/auth/verifySession";
import {
  APP_SETTINGS_TAG,
  updateOthersLibraryEnabled,
} from "@/lib/db/appSettings";

export async function setOthersLibraryMode(enabled: boolean) {
  let error: Error | null = null;

  try {
    const user = await verifySession();

    if (!hasPermission(user, "settings:access")) {
      return { error: "Unauthorized", status: 401 };
    }

    await updateOthersLibraryEnabled(enabled);
    revalidateTag(APP_SETTINGS_TAG, "max");

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
