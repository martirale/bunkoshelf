import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

const ALLOWED = new Set(["ONGOING", "FINISHED", "HIATUS", "CANCELLED"]);

export async function POST(request) {
  let _err;
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { seriesId, status } = body || {};

    if (!seriesId) {
      return NextResponse.json(
        { error: "seriesId requerido" },
        { status: 400 }
      );
    }

    if (!status || !ALLOWED.has(status)) {
      return NextResponse.json({ error: "status inválido" }, { status: 400 });
    }

    const updated = await prisma.mangaSeries.update({
      where: { id: String(seriesId) },
      data: { status },
    });

    return NextResponse.json({ status: updated.status }, { status: 200 });
  } catch (err) {
    _err = err;
  } finally {
    if (_err) {
      console.error("Error updating series status:", _err);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
}

export async function GET(request) {
  let _err;
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const seriesId = url.searchParams.get("seriesId");

    if (!seriesId) {
      return NextResponse.json(
        { error: "seriesId requerido" },
        { status: 400 }
      );
    }

    const record = await prisma.mangaSeries.findUnique({
      where: { id: String(seriesId) },
      select: { status: true },
    });

    if (!record) {
      return NextResponse.json({ error: "no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ status: record.status || "FINISHED" });
  } catch (err) {
    _err = err;
  } finally {
    if (_err) {
      console.error("Error fetching series status:", _err);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
}
