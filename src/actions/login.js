"use server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function login({ username, password, lang = "es" }) {
  if (!username || !password) {
    throw new Error("missing");
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("invalid");
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "180d",
        algorithm: "HS256",
      }
    );

    const cookiesStore = await cookies();
    cookiesStore.set("yomimono_key", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 180 * 24 * 60 * 60, // Six months
    });

    return { success: true };
  } catch (err) {
    console.error(err);
    throw new Error("server");
  }
}
