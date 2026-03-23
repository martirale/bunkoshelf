import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import type { Session } from "@/lib/types";

export async function verifySession(): Promise<Session | null> {
  try {
    const cookiesInstance = await cookies();
    const token = cookiesInstance.get("yomimono_key")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: {
        id: true,
        username: true,
        isAdmin: true,
        role: true,
        name: true,
        lastname: true,
        birthYear: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error en verifySession:", error);
    return null;
  }
}
