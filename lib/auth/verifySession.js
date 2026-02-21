import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

export async function verifySession() {
  try {
    const cookiesInstance = await cookies();
    const token = cookiesInstance.get("yomimono_key")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET),
    );

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        username: true,
        isAdmin: true,
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
