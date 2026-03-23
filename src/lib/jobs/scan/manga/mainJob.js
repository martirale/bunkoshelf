import path from "path";
import fs from "fs/promises";
import { indexVolumesJob } from "./indexVolumesJob";
import { extractCoverJob } from "./extractCoverJob";
import { extractMetadataJob } from "./extractMetadataJob";
import { updateScanStatus } from "./updateScanStatus";
import { log } from "@/lib/logger";

const statusFile = path.join(process.cwd(), "tmp", "scan-status.json");

export async function mainJob() {
  try {
    await fs.mkdir(path.dirname(statusFile), { recursive: true });

    const start = Date.now();
    const startedAt = new Date().toISOString();

    await updateScanStatus({
      startedAt,
      status: "working",
      currentTask: "Indexing volumes",
      steps: {
        index: "working",
        covers: "pending",
        metadata: "pending",
      },
      error: null,
      finishedAt: null,
    });

    await indexVolumesJob();
    await updateScanStatus({
      steps: { index: "done" },
      currentTask: "Extracting covers",
      status: "working",
    });

    await extractCoverJob();
    await updateScanStatus({
      steps: { covers: "done" },
      currentTask: "Extracting metadata",
      status: "working",
    });

    const duration = Date.now() - start;

    await extractMetadataJob();
    await updateScanStatus({
      steps: { metadata: "done" },
      status: "done",
      currentTask: null,
      finishedAt: new Date().toISOString(),
    });

    log({
      event: "Library scan completed",
      category: "LIBRARY",
      duration,
      meta: {
        result: "success",
        steps: ["index", "covers", "metadata"],
      },
    });
  } catch (error) {
    console.error("Error general en mainJob:", error);
    await updateScanStatus({
      status: "error",
      error: error.message || "Error desconocido",
      currentTask: null,
      finishedAt: new Date().toISOString(),
    });

    log({
      event: "Library scan failed",
      category: "LIBRARY",
      duration,
      meta: {
        result: "error",
        message: error.message || "Error desconocido",
      },
    });
  }
}
