"use server";

import { verifySession } from "@/lib/auth/verifySession";
import fs from "fs/promises";
import path from "path";

export async function clearLogs() {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized", status: 401 };
  }

  let error = null;
  try {
    const logPath = path.join(process.cwd(), "app.log");

    try {
      await fs.access(logPath);
      await fs.writeFile(logPath, "");
    } catch (accessErr) {
      console.log("Log file does not exist or is not accessible");
    }

    return { success: true };
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("Error clearing logs:", error);
      return { error: "No se pudo limpiar el log", status: 500 };
    }
  }
}
