import { NextResponse } from "next/server";
import { mainJob } from "@/lib/jobs/scanManga/mainJob";
import { verifySession } from "@/lib/auth/verifySession";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Ejecuta mainJob en segundo plano
    setTimeout(() => {
      mainJob();
    }, 0);

    log({
      event: "Library scan started",
      category: "LIBRARY",
      meta: {
        userId: session.id,
        username: session.username,
        isAdmin: session.isAdmin,
      },
    });

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
