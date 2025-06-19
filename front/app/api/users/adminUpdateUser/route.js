import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

export async function PUT(req) {
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

  try {
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
