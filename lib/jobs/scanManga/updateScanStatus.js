import path from "path";
import fs from "fs/promises";

const statusFile = path.join(process.cwd(), "tmp", "scan-status.json");

export async function updateScanStatus(partialUpdate) {
  let current = {};

  try {
    const data = await fs.readFile(statusFile, "utf-8");
    current = JSON.parse(data);
  } catch (err) {
    // Si no existe, asumimos que estamos inicializando
    current = {};
  }

  // Mezcla profunda parcial (para que solo sobrescriba lo necesario)
  const updated = {
    ...current,
    ...partialUpdate,
    steps: {
      ...current.steps,
      ...partialUpdate.steps,
    },
  };

  await fs.writeFile(statusFile, JSON.stringify(updated, null, 2), "utf-8");
}
