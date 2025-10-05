import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

export async function DELETE(req) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "ID de usuario requerido" },
      { status: 400 }
    );
  }

  const start = Date.now();

  try {
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { username: true, name: true, lastname: true, isAdmin: true },
    });

    await prisma.user.delete({
      where: { id },
    });

    const duration = Date.now() - start;

    log({
      event: "User deletion",
      category: "ADMIN",
      duration,
      meta: {
        userId: id,
        username: userToDelete?.username || "unknown",
        isAdmin: userToDelete?.isAdmin,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar el usuario" },
      { status: 500 }
    );
  }
}
