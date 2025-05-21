import { updateScanStatus } from "./updateScanStatus";

export async function extractMetadataJob() {
  try {
    await updateScanStatus({
      steps: { extractMeta: "running" },
    });

    const res = await fetch(
      "http://localhost:3000/api/admin/scanManga/extractMeta",
      {
        method: "POST",
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
