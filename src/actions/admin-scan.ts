"use server";

import { verifySession } from "@/lib/auth/verifySession";
import { cookies } from "next/headers";

interface ScanActionResult {
  success?: boolean;
  error?: string;
  status?: number;
}

interface ScanStatusResult {
  error?: string;
  status?: number;
  [key: string]: unknown;
}

interface ReindexParams {
  forceAll?: boolean;
}

interface ReindexResult {
  success?: boolean;
  error?: string;
  status?: number;
  [key: string]: unknown;
}

export async function startScan(): Promise<ScanActionResult | undefined> {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized", status: 401 };
  }

  let error: Error | null = null;
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const res = await fetch(
      `${process.env.SITE_URL}/api/admin/scan-manga/start`,
      {
        method: "POST",
        headers: {
          Cookie: cookieHeader,
        },
      }
    );

    if (!res.ok) {
      return { error: "Error al iniciar el escaneo", status: res.status };
    }

    return { success: true };
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error starting scan:", error);
      return { error: "Error al iniciar el escaneo", status: 500 };
    }
  }
}

export async function getScanStatus(): Promise<ScanStatusResult | undefined> {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized", status: 401 };
  }

  let error: Error | null = null;
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const res = await fetch(
      `${process.env.SITE_URL}/api/admin/scan-manga/status`,
      {
        headers: {
          Cookie: cookieHeader,
        },
      }
    );

    if (!res.ok) {
      return {
        error: "Error al obtener status del escaneo",
        status: res.status,
      };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error getting scan status:", error);
      return { error: "Error al obtener status del escaneo", status: 500 };
    }
  }
}

export async function reindexLibrary({ forceAll = true }: ReindexParams): Promise<ReindexResult | undefined> {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized", status: 401 };
  }

  let error: Error | null = null;
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const res = await fetch(
      `${process.env.SITE_URL}/api/admin/scan-manga/index-library`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ forceAll }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || "Error al reindexar", status: res.status };
    }

    return { success: true, ...data };
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error reindexing library:", error);
      return { error: "Error al reindexar", status: 500 };
    }
  }
}

export async function regenerateCovers({ forceAll = true }: ReindexParams): Promise<ReindexResult | undefined> {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized", status: 401 };
  }

  let error: Error | null = null;
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const res = await fetch(
      `${process.env.SITE_URL}/api/admin/scan-manga/extract-cover`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ forceAll }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        error: data.error || "Error al regenerar portadas",
        status: res.status,
      };
    }

    return { success: true, ...data };
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error regenerating covers:", error);
      return { error: "Error al regenerar portadas", status: 500 };
    }
  }
}

export async function reprocessMetadata({ forceAll = true }: ReindexParams): Promise<ReindexResult | undefined> {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized", status: 401 };
  }

  let error: Error | null = null;
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const res = await fetch(
      `${process.env.SITE_URL}/api/admin/scan-manga/extract-meta`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ forceAll }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        error: data.error || "Error al reprocesar metadatos",
        status: res.status,
      };
    }

    return { success: true, ...data };
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error reprocessing metadata:", error);
      return { error: "Error al reprocesar metadatos", status: 500 };
    }
  }
}
