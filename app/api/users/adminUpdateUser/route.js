import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

export async function PUT(req) {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const start = Date.now();
    const body = await req.json();
    const { id, username, password, name, lastname, birthYear, isAdmin } = body;

    if (!id || !username) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const dataToUpdate = {
      username,
      name: name || null,
      lastname: lastname || null,
      birthYear: birthYear || null,
      isAdmin: !!isAdmin,
    };

    if (password && password.length > 0) {
      dataToUpdate.password = await hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    const duration = Date.now() - start;

    log({
      event: "User update",
      category: "ADMIN",
      duration,
      meta: {
        targetUserId: id,
        updatedByAdmin: true,
        username: username || "unknown",
        passwordUpdated: !!password,
        isAdmin: !!isAdmin,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar el usuario" },
      { status: 500 }
    );
  }
}
