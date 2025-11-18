import { updateScanStatus } from "./updateScanStatus";
import { cookies } from "next/headers";

export async function indexVolumesJob() {
  try {
    await updateScanStatus({
      steps: { index: "running" },
    });

    const cookieStore = await cookies();
    const token = cookieStore.get("yomimono_key")?.value;

    if (!token) {
      throw new Error("No hay token de sesión disponible");
    }

    const res = await fetch(
      "http://localhost:3000/api/admin/ScanManga/indexLibrary",
      {
        method: "POST",
        headers: {
          Cookie: `yomimono_key=${token}`,
        },
      }
    );

    if (!res.ok)
      throw new Error(`indexLibrary API responded with status ${res.status}`);

    await updateScanStatus({
      steps: { index: "done" },
    });
  } catch (err) {
    console.error("Error en indexVolumesJob:", err);
    await updateScanStatus({
      steps: { index: "error" },
    });
  }
}
