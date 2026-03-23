import path from "path";
import fs from "fs/promises";
import type { ScanStatus } from "@/lib/types";

const statusFile = path.join(process.cwd(), "tmp", "scan-status.json");

export async function updateScanStatus(partialUpdate: Partial<ScanStatus>): Promise<void> {
  let current: ScanStatus = {};

  try {
    const data = await fs.readFile(statusFile, "utf-8");
    current = JSON.parse(data);
  } catch {
    current = {};
  }

  const updated: ScanStatus = {
    ...current,
    ...partialUpdate,
    steps: {
      ...current.steps,
      ...partialUpdate.steps,
    },
  };

  await fs.writeFile(statusFile, JSON.stringify(updated, null, 2), "utf-8");
}
