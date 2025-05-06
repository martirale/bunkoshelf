import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createSecretKey } from "crypto";

const JWT_SECRET =
  process.env.JWT_SECRET || "a-string-secret-at-least-256-bits-long";

const key = createSecretKey(Buffer.from(JWT_SECRET, "utf-8"));

export async function checkAdminAccess() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  // Si no hay token, retornamos early
  if (!token) return { isAdmin: false, lang: null };

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });

    return {
      isAdmin: !!payload.isAdmin,
      lang: payload.lang || "es",
    };
  } catch (err) {
    return { isAdmin: false, lang: null };
  }
}
