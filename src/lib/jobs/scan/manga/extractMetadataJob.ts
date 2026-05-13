import { updateScanStatus } from "./updateScanStatus";
import { cookies } from "next/headers";

export async function extractMetadataJob(): Promise<void> {
  try {
    await updateScanStatus({
      steps: { extractMeta: "running" },
    });

    const cookieStore = await cookies();
    const token = cookieStore.get("yomimono_key")?.value;

    if (!token) {
      throw new Error("No hay token de sesión disponible");
    }

    const baseUrl = process.env.SITE_URL ?? `http://localhost:${process.env.PORT ?? "3060"}`;
    const res = await fetch(`${baseUrl}/api/admin/scan-manga/extract-meta`, {
      method: "POST",
      headers: {
        Cookie: `yomimono_key=${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`extractMeta API responded with status ${res.status}`);
    }

    await updateScanStatus({
      steps: { extractMeta: "done" },
    });
  } catch (err) {
    console.error("Error en extractMetadataJob:", err);
    await updateScanStatus({
      steps: { extractMeta: "error" },
    });
  }
}
