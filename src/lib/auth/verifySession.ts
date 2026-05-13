import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { findUserSessionById } from "@/lib/db/users";
import type { Session } from "@/lib/types";

function isInvalidJwtError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ("code" in error && typeof error.code === "string") {
    return error.code.startsWith("ERR_JWS_") || error.code.startsWith("ERR_JWT_");
  }
  return false;
}

export async function verifySession(): Promise<Session | null> {
  try {
    const cookiesInstance = await cookies();
    const token = cookiesInstance.get("yomimono_key")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const user = await findUserSessionById(payload.id as string);

    return user;
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    if (isInvalidJwtError(error)) {
      return null;
    }
    console.error("Error en verifySession:", error);
    return null;
  }
}
