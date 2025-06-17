import fs from "fs/promises";
import path from "path";

export async function POST() {
  try {
    const logFilePath = path.join(process.cwd(), "logs", "server.log");

    await fs.writeFile(logFilePath, "");

    return new Response("Log limpiado correctamente", { status: 200 });
  } catch (e) {
    return new Response("Error al limpiar el log", { status: 500 });
  }
}
