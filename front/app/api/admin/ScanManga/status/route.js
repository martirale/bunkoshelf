import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const STATUS_PATH = path.join(process.cwd(), "tmp", "scan-status.json");

export async function GET() {
  try {
    const data = await fs.readFile(STATUS_PATH, "utf-8");
    const status = JSON.parse(data);

    return NextResponse.json(status);
  } catch (err) {
    console.error("Error leyendo scan-status.json:", err);

    // Si no existe el archivo, devolvemos un estado inicial
    if (err.code === "ENOENT") {
      return NextResponse.json({
        steps: {
          index: "pending",
          extractCover: "pending",
          extractMeta: "pending",
        },
      });
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
