import { updateScanStatus } from "./updateScanStatus";

export async function extractCoverJob() {
  try {
    await updateScanStatus({
      steps: { extractCover: "running" },
    });

    const res = await fetch(
      "http://localhost:3000/api/admin/ScanManga/extractCover",
      {
        method: "POST",
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
