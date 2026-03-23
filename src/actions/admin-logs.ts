"use server";

import { verifySession } from "@/lib/auth/verifySession";
import fs from "fs/promises";
import path from "path";

interface GetLogsResult {
  logs?: string;
  error?: string;
  status?: number;
}

interface ClearLogsResult {
  success?: boolean;
  error?: string;
  status?: number;
}

export async function getLogs(): Promise<GetLogsResult | undefined> {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized", status: 401 };
  }

  let error: Error | null = null;
  try {
    const logPath = path.join(process.cwd(), "app.log");

    try {
      await fs.access(logPath);
      const content = await fs.readFile(logPath, "utf-8");
      return { logs: content };
    } catch (accessErr) {
      return { logs: "" };
    }
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error reading logs:", error);
      return { error: "No se pudieron cargar los logs", status: 500 };
    }
  }
}

export async function clearLogs(): Promise<ClearLogsResult | undefined> {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized", status: 401 };
  }

  let error: Error | null = null;
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
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error clearing logs:", error);
      return { error: "No se pudo limpiar el log", status: 500 };
    }
  }
}
