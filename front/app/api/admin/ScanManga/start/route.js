import { NextResponse } from "next/server";
import { mainJob } from "@/lib/jobs/scanManga/mainJob";

export async function POST() {
  try {
    // Ejecuta mainJob en segundo plano
    setTimeout(() => {
      mainJob();
    }, 0);

    return NextResponse.json(
      { ok: true, message: "Escaneo iniciado en segundo plano" },
      { status: 202 }
    );
  } catch (error) {
    console.error("Error al iniciar el escaneo:", error);
    return NextResponse.json(
      { ok: false, error: "Error al iniciar el escaneo" },
      { status: 500 }
    );
  }
}
