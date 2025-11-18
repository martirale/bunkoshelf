import { updateScanStatus } from "./updateScanStatus";
import { cookies } from "next/headers";

export async function extractCoverJob() {
  try {
    await updateScanStatus({
      steps: { extractCover: "running" },
    });

    const cookieStore = await cookies();
    const token = cookieStore.get("yomimono_key")?.value;

    if (!token) {
      throw new Error("No hay token de sesión disponible");
    }

    const res = await fetch(
      "http://localhost:3000/api/admin/ScanManga/extractCover",
      {
        method: "POST",
        headers: {
          Cookie: `yomimono_key=${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`extractCover API responded with status ${res.status}`);
    }

    await updateScanStatus({
      steps: { extractCover: "done" },
    });
  } catch (err) {
    console.error("Error en extractCoverJob:", err);
    await updateScanStatus({
      steps: { extractCover: "error" },
    });
  }
}
