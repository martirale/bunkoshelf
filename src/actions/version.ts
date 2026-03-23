"use server";

import { verifySession } from "@/lib/auth/verifySession";

interface VersionData {
  version: string;
  versionUrl: string;
  changelogUrl: string | null;
  buildDate: string | null;
}

let cached: { timestamp: number; data: VersionData | null } = {
  timestamp: 0,
  data: null,
};

export async function getVersion() {
  let _err: Error | null = null;
  try {
    const user = await verifySession();
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;

    if (cached.data && now - cached.timestamp < maxAge) {
      return cached.data;
    }

    const res = await fetch("https://bunko.am25.app/api/version", {
      cache: "no-cache",
    });
    if (!res.ok) throw new Error("Remote fetch failed");
    const data: VersionData = await res.json();
    cached = { timestamp: Date.now(), data };
    return data;
  } catch (e) {
    _err = e as Error;
  } finally {
    if (_err) {
      if (cached.data) {
        return cached.data;
      }
      return {
        error: "Unable to fetch remote version",
        message: _err?.message ?? null,
        status: 502,
      };
    }
  }
}
