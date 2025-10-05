import { updateScanStatus } from "./updateScanStatus";

export async function indexVolumesJob() {
  try {
    await updateScanStatus({
      steps: { index: "running" },
    });

    const res = await fetch(
      "http://localhost:3000/api/admin/ScanManga/indexLibrary",
      {
        method: "POST",
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
