import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "ID de usuario requerido" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({
      where: { id },
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
