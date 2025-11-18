import { updateScanStatus } from "./updateScanStatus";
import { cookies } from "next/headers";

export async function extractMetadataJob() {
  try {
    await updateScanStatus({
      steps: { extractMeta: "running" },
    });

    const cookieStore = await cookies();
    const token = cookieStore.get("yomimono_key")?.value;

    if (!token) {
      throw new Error("No hay token de sesión disponible");
    }

    const res = await fetch(
      "http://localhost:3000/api/admin/ScanManga/extractMeta",
      {
        method: "POST",
        headers: {
          Cookie: `yomimono_key=${token}`,
        },
      }
    );

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
