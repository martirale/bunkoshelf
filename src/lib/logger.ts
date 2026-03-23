import fs from "fs";
import path from "path";

const logFilePath = path.join(process.cwd(), "logs", "server.log");

interface LogParams {
  event: string;
  category?: string;
  duration?: number;
  meta?: Record<string, unknown>;
}

export function log({ event, category, duration, meta }: LogParams) {
  const timestamp = new Date().toISOString();

  let line = `[${timestamp}]`;

  if (category) {
    line += ` [${category}]`;
  }

  line += ` ${event}`;

  if (duration !== undefined) {
    line += ` | Duration: ${duration}ms`;
  }

  if (meta && typeof meta === "object") {
    const extras = Object.entries(meta)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");
    if (extras) {
      line += ` | ${extras}`;
    }
  }

  line += "\n";

  try {
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
    fs.appendFileSync(logFilePath, line, "utf8");
  } catch (e) {
    console.error("Error al escribir log:", e);
  }
}
