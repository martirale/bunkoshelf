"use server";

import { verifySession } from "@/lib/auth/verifySession";
import { getVersionInfo } from "@/lib/versionInfo";

export async function getVersion() {
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }
    return await getVersionInfo();
  } catch (e) {
    return {
      error: "Unable to fetch version info",
      message: e instanceof Error ? e.message : null,
      status: 502,
    };
  }
}
