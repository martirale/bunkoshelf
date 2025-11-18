import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req) {
  let _err;
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const start = Date.now();
    const body = await req.json().catch(() => ({}));
    const { username, password, name, lastname, birthYear, isAdmin } = body;

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

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: name || null,
        lastname: lastname || null,
        birthYear: birthYear || null,
        isAdmin: !!isAdmin,
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
    _err = error;
  } finally {
    if (_err) {
      console.error("Error creando usuario:", _err);
      return NextResponse.json(
        { error: "Error al crear el usuario" },
        { status: 500 }
      );
    }
  }
}
