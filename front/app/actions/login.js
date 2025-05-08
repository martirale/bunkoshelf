"use server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function login(formData) {
  const username = formData.get("username");
  const password = formData.get("password");

  if (!username || !password) {
    return { error: "Faltan datos" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { error: "Credenciales inválidas" };
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "180d",
        algorithm: "HS256",
      }
    );

    cookies().set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 180 * 24 * 60 * 60, // in seconds (180 days)
    });

    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Error en el servidor" };
  }
}
