import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req) {
  const start = Date.now();
  const { username, password, name, lastname, birthYear, isAdmin } =
    await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "El nombre de usuario ya existe" },
      { status: 400 }
    );
  }

  const hashedPassword = await hash(password, 10);

  try {
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: name || null,
        lastname: lastname || null,
        birthYear: birthYear || null,
        isAdmin: isAdmin || false,
      },
    });

    const duration = Date.now() - start;

    log({
      event: "User creation",
      category: "ADMIN",
      duration,
      meta: {
        userId: newUser.id,
        username: newUser.username,
        isAdmin: newUser.isAdmin,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error("Error creando usuario:", error);
    return NextResponse.json(
      { error: "Error al crear el usuario" },
      { status: 500 }
    );
  }
}
