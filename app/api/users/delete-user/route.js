import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

export async function DELETE(req) {
  let _err;
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    if (id === user.id) {
      return NextResponse.json(
        { error: "No se puede eliminar el propio usuario" },
        { status: 400 }
      );
    }

    const start = Date.now();

    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { username: true, name: true, lastname: true, isAdmin: true },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

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
        username: userToDelete.username || "unknown",
        isAdmin: userToDelete.isAdmin,
        deletedBy: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    _err = error;
  } finally {
    if (_err) {
      console.error("Error al eliminar usuario:", _err);
      return NextResponse.json(
        { error: "Error al eliminar el usuario" },
        { status: 500 }
      );
    }
  }
}
