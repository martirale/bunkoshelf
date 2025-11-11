import prisma from "@/lib/prisma";

const ALLOWED = new Set(["ONGOING", "FINISHED", "HIATUS", "CANCELLED"]);

export async function POST(request) {
  try {
    const body = await request.json();
    const { seriesId, status } = body || {};

    if (!seriesId) {
      return new Response("seriesId requerido", { status: 400 });
    }

    if (!status || !ALLOWED.has(status)) {
      return new Response("status inválido", { status: 400 });
    }

    const where = { id: String(seriesId) };
    const updated = await prisma.mangaSeries.update({
      where,
      data: { status },
    });

    return new Response(String(updated.status), { status: 200 });
  } finally {
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const seriesId = url.searchParams.get("seriesId");

    if (!seriesId) {
      return new Response("seriesId requerido", { status: 400 });
    }

    const record = await prisma.mangaSeries.findUnique({
      where: { id: String(seriesId) },
      select: { status: true },
    });

    if (!record) {
      return new Response("no encontrado", { status: 404 });
    }

    return new Response(String(record.status), { status: 200 });
  } finally {
  }
}
