import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const logFilePath = path.join(process.cwd(), "logs", "server.log");
    const data = await fs.readFile(logFilePath, "utf8");

    const reversedData = data.split("\n").filter(Boolean).reverse().join("\n");

    return new Response(reversedData, { status: 200 });
  } catch (e) {
    return new Response("No se pudo leer el archivo de logs.", { status: 500 });
  }
}
